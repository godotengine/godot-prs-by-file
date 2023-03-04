import { LitElement, html, css, customElement, property } from 'lit-element';

import PullRequestItem from "./PullRequestItem";

@customElement('gr-pull-list')
export default class PullRequestList extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --pulls-background-color: #e5edf8;
            --pulls-toolbar-color: #9bbaed;
            --pulls-toolbar-accent-color: #5a6f90;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --pulls-background-color: #191d23;
              --pulls-toolbar-color: #222c3d;
              --pulls-toolbar-accent-color: #566783;
            }
          }

          /** Component styling **/
          :host {
            flex-grow: 1;
          }

          :host input[type=checkbox] {
            margin: 0;
            vertical-align: bottom;
          }

          :host select {
            background: var(--pulls-background-color);
            border: 1px solid var(--pulls-background-color);
            color: var(--g-font-color);
            font-size: 12px;
            outline: none;
            min-width: 60px;
          }

          :host .file-pulls {
            background-color: var(--pulls-background-color);
            border-radius: 0 4px 4px 0;
            padding: 8px 12px;
            max-width: 760px;
          }

          :host .file-pulls-toolbar {
            background: var(--pulls-toolbar-color);
            border-radius: 4px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding: 10px 14px;
            margin-bottom: 6px;
          }

          :host .pulls-count {
            font-size: 15px;
          }
          :host .pulls-count strong {
            font-size: 18px;
          }
          :host .pulls-count-total {
            color: var(--dimmed-font-color);
          }

          @media only screen and (max-width: 900px) {
            :host .file-pulls {
              padding: 8px;
              max-width: 95%;
              margin: 0px auto;
            }
            :host .file-pulls-toolbar {
              flex-wrap: wrap;
            }
            :host .pulls-count {
              font-size: 17px;
              margin-bottom: 12px;
              text-align: center;
              width: 100%;
            }
            :host .pulls-count strong {
              font-size: 20px;
            }
          }
        `;
    }

    @property({ type: Array }) pulls = [];
    @property({ type: Object }) authors = {};
    
    @property({ type: String }) selectedBranch = "";
    @property({ type: String }) selectedPath = "";
    @property({ type: Array }) selectedPulls = [];
    @property({ type: String }) filteredPull = "";

    render(){
        if (this.selectedPath === "") {
            return html``;
        }

        let pulls = [].concat(this.pulls);
        pulls = pulls.filter((item) => {
            if (item.target_branch !== this.selectedBranch) {
                return false;
            }

            if (!this.selectedPulls.includes(item.public_id)) {
                return false;
            }

            return true;
        });

        const total_pulls = this.pulls.length;
        let filtered_pulls = pulls.length
        
        const has_pinned = (this.filteredPull !== "");
        if (has_pinned) {
          filtered_pulls -= 1;
        }

        return html`
            <div class="file-pulls">
                ${pulls.map((item) => {
                    if (!has_pinned || parseInt(this.filteredPull, 10) !== item.public_id) {
                        return html``;
                    }

                    let author = null;
                    if (typeof this.authors[item.authored_by] != "undefined") {
                        author = this.authors[item.authored_by];
                    }

                    return html`
                        <gr-pull-request
                            .id="${item.public_id}"
                            .title="${item.title}"
                            .url="${item.url}"
                            ?draft="${item.is_draft}"

                            .milestone="${item.milestone}"
                            .branch="${item.target_branch}"

                            .created_at="${item.created_at}"
                            .updated_at="${item.updated_at}"
                            .author="${author}"

                            .diff_url="${item.diff_url}"
                            .patch_url="${item.patch_url}"
                        />
                    `;
                })}

                <div class="file-pulls-toolbar">
                    <div class="pulls-count">
                        <span>${(has_pinned ? "Other " : "")}PRs affecting this path: </span>
                        <strong>${filtered_pulls}</strong>
                        ${(filtered_pulls !== total_pulls) ? html`
                            <span class="pulls-count-total"> (out of ${total_pulls})</span>
                        ` : ''
                        }
                    </div>
                </div>

                ${pulls.map((item) => {
                    if (has_pinned && parseInt(this.filteredPull, 10) === item.public_id) {
                        return html``;
                    }

                    let author = null;
                    if (typeof this.authors[item.authored_by] != "undefined") {
                        author = this.authors[item.authored_by];
                    }

                    return html`
                        <gr-pull-request
                            .id="${item.public_id}"
                            .title="${item.title}"
                            .url="${item.url}"
                            ?draft="${item.is_draft}"

                            .milestone="${item.milestone}"
                            .branch="${item.target_branch}"

                            .created_at="${item.created_at}"
                            .updated_at="${item.updated_at}"
                            .author="${author}"

                            .diff_url="${item.diff_url}"
                            .patch_url="${item.patch_url}"
                        />
                    `;
                 })}
            </div>
        `;
    }
}