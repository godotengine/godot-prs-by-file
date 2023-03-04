import { LitElement, html, css, customElement, property } from 'lit-element';

import PageContent from 'src/shared/components/PageContent';
import IndexHeader from "./components/IndexHeader";
import IndexDescription from "./components/IndexDescription";

import FileList from "./components/files/FileList";

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
            margin-top: 16px;
          }
        `;
    }

    constructor() {
        super();

        this._entryRequested = false;
        this._isLoading = true;
        this._generatedAt = null;

        this._branches = [];
        this._files = {};

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

            this._branches = [];
            this._files = {};
        }

        this._isLoading = false;
        this.requestUpdate();
    }

    render(){
        return html`
            <page-content>
                <gr-index-entry .generated_at="${this._generatedAt}"></gr-index-entry>
                <gr-index-description></gr-index-description>

                ${(this._isLoading ? html`
                    <h3>Loading...</h3>
                ` : html`
                    <div class="files">
                        <gr-file-list
                            .branches="${this._branches}"
                            .files="${this._files}"
                        ></gr-file-list>
                    </div>
                `)}
            </page-content>
        `;
    }
}
