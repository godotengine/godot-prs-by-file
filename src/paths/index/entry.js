import { LitElement, html, css, customElement, property } from 'lit-element';

import PageContent from 'src/shared/components/PageContent';
import SharedNavigation from 'src/shared/components/SharedNavigation';
import IndexHeader from "./components/IndexHeader";
import IndexDescription from "./components/IndexDescription";

import PullFilter from './components/filters/PullFilter';
import FileList from "./components/files/FileList";
import PullList from "./components/pulls/PullRequestList"

@customElement('entry-component')
export default class EntryComponent extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
          }
          @media (prefers-color-scheme: dark) {
            :host {
            }
          }

          /** Component styling **/
          :host {
          }

          :host .files {
            display: flex;
            padding: 24px 0;
          }

          @media only screen and (max-width: 900px) {
            :host .files {
              flex-wrap: wrap;
            }
          }
        `;
    }

    constructor() {
        super();

        this._entryRequested = false;
        this._isLoading = true;
        this._generatedAt = null;

        this._authors = {};
        this._branches = [];
        this._files = {};
        this._pulls = [];

        this._selectedRepository = "godotengine/godot";
        this._selectedBranch = "master";
        this._selectedPath = "";
        this._selectedPathPulls = [];

        this._filteredPull = "";

        this._restoreUserPreferences();
        this._requestData();
    }

    performUpdate() {
        this._requestData();
        super.performUpdate();
    }

    _restoreUserPreferences() {
        const userPreferences = greports.util.getLocalPreferences();

        this._selectedRepository = userPreferences["selectedRepository"];
        this._restoreSelectedBranch();
    }

    _restoreSelectedBranch() {
        const userPreferences = greports.util.getLocalPreferences();

        if (typeof userPreferences["selectedBranches"][this._selectedRepository] !== "undefined") {
            this._selectedBranch = userPreferences["selectedBranches"][this._selectedRepository];
        } else {
            this._selectedBranch = "master";
        }
    }

    _saveUserPreferences() {
        const storedPreferences = greports.util.getLocalPreferences();
        let selectedBranches = storedPreferences["selectedBranches"];
        selectedBranches[this._selectedRepository] = this._selectedBranch;

        const currentPreferences = {
            "selectedRepository" : this._selectedRepository,
            "selectedBranches"   : selectedBranches,
        };

        greports.util.setLocalPreferences(currentPreferences);
    }

    async _requestData() {
        if (this._entryRequested) {
            return;
        }
        this._entryRequested = true;
        this._isLoading = true;

        const requested_repo = greports.util.getHistoryHash();
        if (requested_repo !== "" && this._selectedRepository !== requested_repo) {
            this._selectedRepository = requested_repo;
            this._restoreSelectedBranch();
        }
        const data = await greports.api.getData(this._selectedRepository);

        if (data) {
            this._generatedAt = data.generated_at;
            this._authors = data.authors;
            this._pulls = data.pulls;

            data.branches.forEach((branch) => {
                if (typeof data.files[branch] === "undefined") {
                    return;
                }

                this._branches.push(branch);
                const branchFiles = {};

                data.files[branch].forEach((file) => {
                    if (file.type === "file" || file.type === "folder") {
                        if (typeof branchFiles[file.parent] === "undefined") {
                            branchFiles[file.parent] = [];
                        }
    
                        branchFiles[file.parent].push(file);
                    }
                });

                for (let folderName in branchFiles) {
                    branchFiles[folderName].sort((a, b) => {
                        if (a.type === "folder" && b.type !== "folder") {
                            return -1;
                        }
                        if (b.type === "folder" && a.type !== "folder") {
                            return 1;
                        }
        
                        const a_name = a.path.toLowerCase();
                        const b_name = b.path.toLowerCase();
        
                        if (a_name > b_name) return 1;
                        if (a_name < b_name) return -1;
                        return 0;
                    });
                }

                this._files[branch] = branchFiles;
            });

            // If our prefered branch doesn't exist, pick master.
            if (typeof this._files[this._selectedBranch] === "undefined") {
                this._selectedBranch = "master";
            }
            // If master doesn't exist, pick the first available.
            if (typeof this._files[this._selectedBranch] === "undefined" && data.branches.length > 0) {
                this._selectedBranch = data.branches[0];
            }
        } else {
            this._generatedAt = null;

            this._authors = {};
            this._branches = [];
            this._files = {};
            this._pulls = [];

            this._selectedBranch = "master";
            this._selectedPath = "";
            this._selectedPathPulls = [];
        }

        this._isLoading = false;
        this.requestUpdate();
    }

    _onPullFilterChanged(event) {
        this._filteredPull = event.detail.pull;
        if (this._filteredPull !== "") {
            const pullNumber = parseInt(this._filteredPull, 10);
            if (!this._selectedPathPulls.includes(pullNumber)) {
                this._selectedPath = "";
                this._selectedPathPulls = [];
            }
        }

        this.requestUpdate();
    }

    _onBranchSelected(event) {
        if (this._selectedBranch === event.detail.branch) {
            return;
        }

        this._selectedBranch = event.detail.branch;
        this._selectedPath = "";
        this._selectedPathPulls = [];

        this._saveUserPreferences()
        this.requestUpdate();
    }

    _onPathClicked(event) {
        this._selectedPath = event.detail.path;
        this._selectedPathPulls = event.detail.pulls;
        this.requestUpdate();

        window.scrollTo(0, 0);
    }

    render(){
        return html`
            <page-content>
                <shared-nav></shared-nav>
                <gr-index-entry .generated_at="${this._generatedAt}"></gr-index-entry>
                <gr-index-description></gr-index-description>

                ${(this._isLoading ? html`
                    <h3>Loading...</h3>
                ` : html`
                    <gr-pull-filter
                        @filterchanged="${this._onPullFilterChanged}"
                    ></gr-pull-filter>

                    <div class="files">
                        <gr-file-list
                            .branches="${this._branches}"
                            .files="${this._files}"
                            .selectedRepository="${this._selectedRepository}"
                            .selectedBranch="${this._selectedBranch}"
                            .selectedPath="${this._selectedPath}"
                            .filteredPull="${this._filteredPull}"
                            @branchselect="${this._onBranchSelected}"
                            @pathclick="${this._onPathClicked}"
                        ></gr-file-list>

                        <gr-pull-list
                            .pulls="${this._pulls}"
                            .authors="${this._authors}"
                            .selectedBranch="${this._selectedBranch}"
                            .selectedPath="${this._selectedPath}"
                            .selectedPulls="${this._selectedPathPulls}"
                            .filteredPull="${this._filteredPull}"
                        ></gr-pull-list>
                    </div>
                `)}
            </page-content>
        `;
    }
}
