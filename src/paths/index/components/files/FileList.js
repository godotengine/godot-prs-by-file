import { LitElement, html, css, customElement, property } from 'lit-element';

import RootItem from "./RootItem"
import FileItem from "./FileItem";

@customElement('gr-file-list')
export default class FileList extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --files-background-color: #fcfcfa;
            --files-border-color: #515c6c;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --files-background-color: #0d1117;
              --files-border-color: #515c6c;
            }
          }

          /** Component styling **/
          :host {
          }

          :host .file-list {
            background-color: var(--files-background-color);
            border-right: 2px solid var(--files-border-color);
            width: 320px;
            min-height: 216px;
          }

          :host .file-list-folder .file-list-folder {
            margin-left: 12px;
          }

          @media only screen and (max-width: 900px) {
            :host {
              width: 100%
            }

            :host .file-list {
              width: 100% !important;
            }
          }
        `;
    }

    @property({ type: Array }) branches = [];
    @property({ type: Object }) files = {};

    @property({ type: String }) selectedRepository = "godotengine/godot";
    @property({ type: String }) selectedBranch = "master";
    @property({ type: String }) selectedPath = "";
    @property({ type: Array }) selectedFolders = [];

    constructor() {
        super();
    }

    _onItemClicked(entryType, entryPath, entryPulls) {
      if (entryType === "root") {
        this.selectedFolders = [];

        this.requestUpdate();
      } else if (entryType === "folder") {
        const entryIndex = this.selectedFolders.indexOf(entryPath);
        if (entryIndex >= 0) {
          this.selectedFolders.splice(entryIndex, 1);
        } else {
          this.selectedFolders.push(entryPath);
        }

        this.requestUpdate();
      }

      this.dispatchEvent(greports.util.createEvent("pathclicked", {
          "type": entryType,
          "path": entryPath,
          "pulls": entryPulls,
      }));
    }

    renderFolder(branchFiles, folderFiles) {
      return html`
        <div class="file-list-folder">
            ${(folderFiles.length > 0) ?
                folderFiles.map((item) => {
                    return html`
                        <div>
                            <gr-file-item
                                .path="${item.path}"
                                .name="${item.name}"
                                .type="${item.type}"
                                .pull_count="${item.pulls.length}"
                                ?active="${this.selectedPath.indexOf(item.path) === 0}"
                                @click="${this._onItemClicked.bind(this, item.type, item.path, item.pulls)}"
                            ></gr-file-item>

                            ${(this.selectedFolders.includes(item.path)) ? 
                              this.renderFolder(branchFiles, branchFiles[item.path] || []) : null
                            }
                        </div>
                    `;
                }) : html`
                    <span>This path is empty</span>
                `
            }
        </div>
      `;
    }

    render() {
        const branchFiles = this.files[this.selectedBranch];
        const topLevel = branchFiles[""] || [];

        return html`
            <div class="file-list">
              <gr-root-item
                .repository="${this.selectedRepository}"
                .branch="${this.selectedBranch}"
                @click="${this._onItemClicked.bind(this, "root", "", [])}"
              ></gr-root-item>

              ${this.renderFolder(branchFiles, topLevel)}
            </div>
        `;
    }
}
