import { LitElement, html, css, customElement, property } from 'lit-element';

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
    @property({ type: String }) selected = "";

    constructor() {
        super();
    }

    render() {
        const topLevel = this.files[""] || [];

        return html`
            <div class="file-list">
                <div class="file-list-section">
                    ${(topLevel.length > 0) ?
                        topLevel.map((item) => {
                            return html`
                                <gr-file-item
                                    .path="${item.path}"
                                    .name="${item.name}"
                                    .type="${item.type}"
                                    .pull_count="${item.pull_count}"
                                    ?active="${false}"
                                />
                            `;
                        }) : html`
                            <span>There are no files</span>
                        `
                    }
                </div>
            </div>
        `;
    }
}
