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

    @property({ type: Object }) files = {};
    @property({ type: Array }) selected = [];

    constructor() {
        super();
    }

    _onItemClicked(entryType, entryPath) {
      if (entryType !== "folder") {
        return;
      }

      const entryIndex = this.selected.indexOf(entryPath);
      if (entryIndex >= 0) {
        this.selected.splice(entryIndex, 1);
      } else {
        this.selected.push(entryPath);
      }

      this.requestUpdate();
    }

    renderFolder(levelEntries) {
      return html`
        <div class="file-list-folder">
            ${(levelEntries.length > 0) ?
                levelEntries.map((item) => {
                    return html`
                        <div>
                            <gr-file-item
                                .path="${item.path}"
                                .name="${item.name}"
                                .type="${item.type}"
                                .pull_count="${item.pull_count}"
                                ?active="${this.selected.includes(item.path)}"
                                @click="${this._onItemClicked.bind(this, item.type, item.path)}"
                            ></gr-file-item>

                            ${(this.selected.includes(item.path)) ? 
                              this.renderFolder(this.files[item.path] || []) : null
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
        const topLevel = this.files[""] || [];

        return html`
            <div class="file-list">
              <gr-root-item
                .repository="${"godotengine/godot"}"
                .branch="${"master"}"
              ></gr-root-item>

              ${this.renderFolder(topLevel)}
            </div>
        `;
    }
}
