const fs = require('fs').promises;
const fsConstants = require('fs').constants;
const fetch = require('node-fetch');

const ExitCodes = {
    "RequestFailure": 1,
    "ParseFailure": 2,
};

const PULLS_PER_PAGE = 100;
const API_RATE_LIMIT = `
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
`;

class DataFetcher {
    constructor(data_owner, data_repo) {
        this.api_rest_path = `https://api.github.com/repos/${data_owner}/${data_repo}`;
        this.api_repository_id = `owner:"${data_owner}" name:"${data_repo}"`;

        this.page_count = 1;
        this.last_cursor = "";
    }

    async _logResponse(data, name) {
        try {
            try {
                await fs.access("logs", fsConstants.R_OK | fsConstants.W_OK);
            } catch (err) {
                await fs.mkdir("logs");
            }
    
            await fs.writeFile(`logs/${name}.json`, JSON.stringify(data, null, 4), {encoding: "utf-8"});
        } catch (err) {
            console.error("Error saving log file: " + err);
        }
    }
    
    _handleResponseErrors(queryID, res) {
        console.warn(`    Failed to get data from '${queryID}'; server responded with ${res.status} ${res.statusText}`);
        const retry_header = res.headers.get("Retry-After");
        if (retry_header) {
            console.log(`    Retry after: ${retry_header}`);
        }
    }
    
    _handleDataErrors(data) {
        if (typeof data["errors"] === "undefined") {
            return;
        }
    
        console.warn(`    Server handled the request, but there were errors:`);
        data.errors.forEach((item) => {
           console.log(`    [${item.type}] ${item.message}`);
        });
    }
    
    async fetchGithub(query) {
        const init = {};
        init.method = "POST";
        init.headers = {};
        init.headers["Content-Type"] = "application/json";
        if (process.env.GRAPHQL_TOKEN) {
            init.headers["Authorization"] = `token ${process.env.GRAPHQL_TOKEN}`;
        } else if (process.env.GITHUB_TOKEN) {
            init.headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
        }
    
        init.body = JSON.stringify({
            query,
        });
    
        return await fetch("https://api.github.com/graphql", init);
    }

    async fetchGithubRest(query) {
        const init = {};
        init.method = "GET";
        init.headers = {};
        init.headers["Content-Type"] = "application/json";
        if (process.env.GRAPHQL_TOKEN) {
            init.headers["Authorization"] = `token ${process.env.GRAPHQL_TOKEN}`;
        } else if (process.env.GITHUB_TOKEN) {
            init.headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
        }
    
        return await fetch(`${this.api_rest_path}${query}`, init);
    }
    
    async checkRates() {
        try {
            const query = `
            query {
              ${API_RATE_LIMIT}
            }
            `;
    
            const res = await this.fetchGithub(query);
            if (res.status !== 200) {
                this._handleResponseErrors(this.api_repository_id, res);
                process.exitCode = ExitCodes.RequestFailure;
                return;
            }
    
            const data = await res.json();
            await this._logResponse(data, "_rate_limit");
            this._handleDataErrors(data);
    
            const rate_limit = data.data["rateLimit"];
            console.log(`    [$${rate_limit.cost}] Available API calls: ${rate_limit.remaining}/${rate_limit.limit}; resets at ${rate_limit.resetAt}`);
        } catch (err) {
            console.error("    Error checking the API rate limits: " + err);
            process.exitCode = ExitCodes.RequestFailure;
            return;
        }
    }
    
    async fetchPulls(page) {
        try {
            let after_cursor = "";
            let after_text = "initial";
            if (this.last_cursor !== "") {
                after_cursor = `after: "${this.last_cursor}"`;
                after_text = after_cursor;
            }

            const query = `
            query {
              ${API_RATE_LIMIT}
              repository(${this.api_repository_id}) {
                pullRequests(first:${PULLS_PER_PAGE} ${after_cursor} states: OPEN) {
                  totalCount
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                  edges {
                    node {
                      id
                      number
                      url
                      title
                      state
                      isDraft
                      
                      createdAt
                      updatedAt
                      
                      baseRef {
                        name
                      }
                      
                      author {
                        login
                        avatarUrl
                        url
                        
                        ... on User {
                          id
                        }
                      }
                      
                      milestone {
                        id
                        title
                        url
                      }

                      files (first: 100) {
                        edges {
                          node {
                            path
                            changeType
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            `;
    
            let page_text = page;
            if (this.page_count > 1) {
                page_text = `${page}/${this.page_count}`;
            }
            console.log(`    Requesting page ${page_text} of pull request data (${after_text}).`);
    
            const res = await this.fetchGithub(query);
            if (res.status !== 200) {
                this._handleResponseErrors(this.api_repository_id, res);
                process.exitCode = ExitCodes.RequestFailure;
                return [];
            }
    
            const data = await res.json();
            await this._logResponse(data, `data_page_${page}`);
            this._handleDataErrors(data);
    
            const rate_limit = data.data["rateLimit"];
            const repository = data.data["repository"];
            const pulls_data = mapNodes(repository.pullRequests);
    
            console.log(`    [$${rate_limit.cost}] Retrieved ${pulls_data.length} pull requests; processing...`);
    
            this.last_cursor = repository.pullRequests.pageInfo.endCursor;
            this.page_count = Math.ceil(repository.pullRequests.totalCount / PULLS_PER_PAGE);
    
            return pulls_data;
        } catch (err) {
            console.error("    Error fetching pull request data: " + err);
            process.exitCode = ExitCodes.RequestFailure;
            return [];
        }
    }

    async fetchFiles(branch) {
        try {
            const query = `/git/trees/${branch}?recursive=1`;

            const res = await this.fetchGithubRest(query);
            if (res.status !== 200) {
                this._handleResponseErrors(query, res);
                process.exitCode = ExitCodes.RequestFailure;
                return [];
            }
    
            const data = await res.json();
            await this._logResponse(data, `data_files_${branch}`);
            this._handleDataErrors(data);

            const files_data = data.tree;

            console.log(`    [$0] Retrieved ${files_data.length} file system entries in '${branch}'; processing...`);
    
            return files_data;
        } catch (err) {
            console.error("    Error fetching pull request data: " + err);
            process.exitCode = ExitCodes.RequestFailure;
            return [];
        }
    }
}

class DataProcessor {
    constructor() {
        this.authors = {};
        this.pulls = [];
        this.branches = [];
        this.files = {};

        this._pullsByFile = {};
    }

    _explainFileType(type) {
        switch(type) {
            case "blob":
                return "file";
            case "tree":
                return "folder";
            default:
                return "unknown";
        }
    }

    processPulls(pullsRaw) {
        try {
            pullsRaw.forEach((item) => {
                // Compile basic information about a PR.
                let pr = {
                    "id": item.id,
                    "public_id": item.number,
                    "url": item.url,
                    "diff_url": `${item.url}.diff`,
                    "patch_url": `${item.url}.patch`,

                    "title": item.title,
                    "state": item.state,
                    "is_draft": item.isDraft,
                    "authored_by": null,
                    "created_at": item.createdAt,
                    "updated_at": item.updatedAt,

                    "target_branch": item.baseRef.name,
                    "milestone": null,

                    "files": [],
                };

                // Store the target branch if it hasn't been stored.
                if (!this.branches.includes(pr.target_branch)) {
                    this.branches.push(pr.target_branch);
                }

                // Compose and link author information.
                const author = {
                    "id": "",
                    "user": "ghost",
                    "avatar": "https://avatars.githubusercontent.com/u/10137?v=4",
                    "url": "https://github.com/ghost",
                    "pull_count": 0,
                };
                if (item.author != null) {
                    author["id"] = item.author.id;
                    author["user"] = item.author.login;
                    author["avatar"] = item.author.avatarUrl;
                    author["url"] = item.author.url;
                }
                pr.authored_by = author.id;

                // Store the author if they haven't been stored.
                if (typeof this.authors[author.id] === "undefined") {
                    this.authors[author.id] = author;
                }
                this.authors[author.id].pull_count++;

                // Add the milestone, if available.
                if (item.milestone) {
                    pr.milestone = {
                        "id": item.milestone.id,
                        "title": item.milestone.title,
                        "url": item.milestone.url,
                    };
                }

                // Add changed files.
                let files = mapNodes(item.files);
                const visitedPaths = [];

                if (typeof this._pullsByFile[pr.target_branch] === "undefined") {
                    this._pullsByFile[pr.target_branch] = {};
                }

                files.forEach((fileItem) => {
                    let currentPath = fileItem.path;
                    while (currentPath !== "") {
                        if (visitedPaths.includes(currentPath)) {
                            // Go one level up.
                            const pathBits = currentPath.split("/");
                            pathBits.pop();
                            currentPath = pathBits.join("/");

                            continue;
                        }
                        visitedPaths.push(currentPath);

                        pr.files.push({
                            "path": currentPath,
                            "changeType": (currentPath === fileItem.path ? fileItem.changeType : ""),
                            "type": (currentPath === fileItem.path ? "file" : "folder"),
                        });

                        // Cache the pull information for every file and folder that it includes.
                        if (typeof this._pullsByFile[pr.target_branch][currentPath] === "undefined") {
                            this._pullsByFile[pr.target_branch][currentPath] = [];
                        }
                        this._pullsByFile[pr.target_branch][currentPath].push(pr.public_id);

                        // Go one level up.
                        const pathBits = currentPath.split("/");
                        pathBits.pop();
                        currentPath = pathBits.join("/");
                    }
                });
                pr.files.sort((a, b) => {
                    if (a.name > b.name) return 1;
                    if (a.name < b.name) return -1;
                    return 0;
                });

                this.pulls.push(pr);
            });
        } catch (err) {
            console.error("    Error parsing pull request data: " + err);
            process.exitCode = ExitCodes.ParseFailure;
        }
    }

    processFiles(targetBranch, filesRaw) {
        try {
            this.files[targetBranch] = [];

            filesRaw.forEach((item) => {
                let file = {
                    "type": this._explainFileType(item.type),
                    "name": item.path.split("/").pop(),
                    "path": item.path,
                    "parent": "",
                    "pulls": [],
                };

                // Store the parent path for future reference.
                let parentPath = item.path.split("/");
                parentPath.pop();
                if (parentPath.length > 0) {
                    file.parent = parentPath.join("/");
                }

                // Fetch the PRs touching this file or folder from the cache.
                if (typeof this._pullsByFile[targetBranch] !== "undefined"
                    && typeof this._pullsByFile[targetBranch][file.path] !== "undefined") {

                    this._pullsByFile[targetBranch][file.path].forEach((pullNumber) => {
                        if (!file.pulls.includes(pullNumber)) {
                            file.pulls.push(pullNumber);
                        }
                    });
                }

                this.files[targetBranch].push(file);
            });
        } catch (err) {
            console.error("    Error parsing repository file system: " + err);
            process.exitCode = ExitCodes.ParseFailure;
        }
    }
}

function mapNodes(object) {
    return object.edges.map((item) => item["node"])
}

async function main() {
    // Internal utility methods.
    const checkForExit = () => {
        if (process.exitCode > 0) {
            process.exit();
        }
    }
    const delay = async (msec) => {
        return new Promise(resolve => setTimeout(resolve, msec));
    }

    console.log("[*] Building local pull request database.");

    let data_owner = "godotengine";
    let data_repo = "godot";
    process.argv.forEach((arg) => {
        if (arg.indexOf("owner:") === 0) {
            data_owner = arg.substring(6);
        }
        if (arg.indexOf("repo:") === 0) {
            data_repo = arg.substring(5);
        }
    });

    const dataFetcher = new DataFetcher(data_owner, data_repo);
    const dataProcessor = new DataProcessor();

    console.log("[*] Checking the rate limits before.");
    await dataFetcher.checkRates();
    checkForExit();

    console.log("[*] Fetching pull request data from GitHub.");
    // Pages are starting with 1 for better presentation.
    let page = 1;
    while (page <= dataFetcher.page_count) {
        const pullsRaw = await dataFetcher.fetchPulls(page);
        dataProcessor.processPulls(pullsRaw);
        checkForExit();
        page++;

        // Wait for a bit before proceeding to avoid hitting the secondary rate limit in GitHub API.
        // See https://docs.github.com/en/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits.
        await delay(1500);
    }

    console.log("[*] Fetching repository file system from GitHub.");
    for (let branch of dataProcessor.branches) {
        const filesRaw = await dataFetcher.fetchFiles(branch);
        dataProcessor.processFiles(branch, filesRaw);
        checkForExit();
    }

    console.log("[*] Checking the rate limits after.")
    await dataFetcher.checkRates();
    checkForExit();

    console.log("[*] Finalizing database.")
    const output = {
        "generated_at": Date.now(),
        "authors": dataProcessor.authors,
        "pulls": dataProcessor.pulls,
        "branches": dataProcessor.branches,
        "files": dataProcessor.files,
    };
    try {
        console.log("[*] Storing database to file.")
        await fs.writeFile(`out/${data_owner}.${data_repo}.data.json`, JSON.stringify(output), {encoding: "utf-8"});
    } catch (err) {
        console.error("Error saving database file: " + err);
    }
}

main();
