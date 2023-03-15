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
            position: relative;
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

          :host .branch-selector {
            display: none;
            position: absolute;
            top: 32px;
            left: 0;
            right: 0;
            flex-direction: column;
            gap: 4px;
            background-color: var(--g-background-extra2-color);
            border-top: 2px solid var(--g-background-color);
            border-bottom: 2px solid var(--g-background-color);
            padding: 10px 14px;
          }
          :host .branch-selector.branch-selector--active {
            display: flex;
          }

          :host .branch-selector ul {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
            list-style: none;
            margin: 0;
            padding: 0;
          }

          :host .branch-selector ul li {
            color: var(--link-font-color);
            cursor: pointer;
            padding: 2px 0;
          }
          :host .branch-selector ul li:hover {
            color: var(--link-font-color-hover);
          }

          @media only screen and (max-width: 900px) {
            :host {
              width: 100%
            }

            :host .file-list {
              width: 100% !important;
            }

            :host .branch-selector {
              border-top-width: 4px;
              border-bottom-width: 4px;
              font-size: 105%;
              padding: 16px 24px;
              top: 40px;
            }

            :host .branch-selector ul {
              gap: 4px;
            }

            :host .branch-selector ul li {
              padding: 4px 8px;
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
    @property({ type: String }) filteredPull = "";

    constructor() {
        super();

        this._branchSelectorActive = false;
    }

    _onBranchClicked() {
      this._branchSelectorActive = !this._branchSelectorActive;
      this.requestUpdate();
    }

    _onBranchSelected(branchName) {
      this._branchSelectorActive = false;

      if (this.selectedBranch !== branchName) {
        this.selectedFolders = [];
      }

      this.requestUpdate();

      this.dispatchEvent(greports.util.createEvent("branchselect", {
        "branch": branchName,
      }));
    }

    _toggleEntry(entryType, entryPath, failOnMatch) {
      if (entryType === "root") {
        this.selectedFolders = [];

        this.requestUpdate();
      } else if (entryType === "folder") {
        const entryIndex = this.selectedFolders.indexOf(entryPath);
        if (entryIndex >= 0) {
          if (!failOnMatch) {
            this.selectedFolders.splice(entryIndex, 1);
          }
        } else {
          this.selectedFolders.push(entryPath);
        }

        this.requestUpdate();
      }
    }

    _onItemClicked(entryType, entryPath, entryPulls) {
      this._toggleEntry(entryType, entryPath, true);

      this.dispatchEvent(greports.util.createEvent("pathclick", {
          "type": entryType,
          "path": entryPath,
          "pulls": entryPulls,
      }));
    }

    _onItemIconClicked(entryType, entryPath, entryPulls) {
      this._toggleEntry(entryType, entryPath, false);

      if (entryType === "root" || entryType === "file") {
        this.dispatchEvent(greports.util.createEvent("pathclick", {
            "type": entryType,
            "path": entryPath,
            "pulls": entryPulls,
        }));
      }
    }

    renderFolder(branchFiles, folderFiles) {
      return html`
        <div class="file-list-folder">
            ${(folderFiles.length > 0) ?
                folderFiles.map((item) => {
                    if (this.filteredPull !== "" && !item.pulls.includes(parseInt(this.filteredPull, 10))) {
                      return html``;
                    }

                    return html`
                        <div>
                            <gr-file-item
                                .path="${item.path}"
                                .name="${item.name}"
                                .type="${item.type}"
                                .pull_count="${item.pulls.length}"
                                ?active="${this.selectedPath.indexOf(item.path) === 0}"
                                @click="${this._onItemClicked.bind(this, item.type, item.path, item.pulls)}"
                                @iconclick="${this._onItemIconClicked.bind(this, item.type, item.path, item.pulls)}"
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

        const branchesClassList = [ "branch-selector" ];
        if (this._branchSelectorActive) {
          branchesClassList.push("branch-selector--active");
        }

        return html`
            <div class="file-list">
              <gr-root-item
                .repository="${this.selectedRepository}"
                .branch="${this.selectedBranch}"
                @click="${this._onItemClicked.bind(this, "root", "", [])}"
                @iconclick="${this._onItemIconClicked.bind(this, "root", "", [])}"
                @branchclick="${this._onBranchClicked}"
              ></gr-root-item>

              ${this.renderFolder(branchFiles, topLevel)}
            </div>
            <div class="${branchesClassList.join(" ")}">
              <div>Available branches:</div>
              <ul>
                ${this.branches.map((item) => {
                  return html`
                    <li
                      @click="${this._onBranchSelected.bind(this, item)}"
                    >
                      ${item}
                    </li>
                  `;
                })}
              </ul>
            </div>
        `;
    }
}
