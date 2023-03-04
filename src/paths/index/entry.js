import { LitElement, html, css, customElement, property } from 'lit-element';

import PageContent from 'src/shared/components/PageContent';
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

        this._requestData();
    }

    performUpdate() {
        this._requestData();
        super.performUpdate();
    }

    async _requestData() {
        if (this._entryRequested) {
            return;
        }
        this._entryRequested = true;
        this._isLoading = true;
        const data = await greports.api.getData();

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
        } else {
            this._generatedAt = null;

            this._authors = {};
            this._branches = [];
            this._files = {};
            this._pulls = [];

            this._selectedRepository = "godotengine/godot";
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

    _onPathClicked(event) {
        this._selectedPath = event.detail.path;
        this._selectedPathPulls = event.detail.pulls;
        this.requestUpdate();
    }

    render(){
        return html`
            <page-content>
                <gr-index-entry .generated_at="${this._generatedAt}"></gr-index-entry>
                <gr-index-description></gr-index-description>

                <gr-pull-filter
                    @filterchanged="${this._onPullFilterChanged}"
                ></gr-pull-filter>

                ${(this._isLoading ? html`
                    <h3>Loading...</h3>
                ` : html`
                    <div class="files">
                        <gr-file-list
                            .branches="${this._branches}"
                            .files="${this._files}"
                            .selectedRepository="${this._selectedRepository}"
                            .selectedBranch="${this._selectedBranch}"
                            .selectedPath="${this._selectedPath}"
                            .filteredPull="${this._filteredPull}"
                            @pathclicked="${this._onPathClicked}"
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
