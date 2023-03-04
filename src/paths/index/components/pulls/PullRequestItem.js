import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-pull-request')
export default class PullRequestItem extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --pr-border-color: #fcfcfa;
            --star-font-color: #ffcc31;
            --ghost-font-color: #738b99;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --pr-border-color: #0d1117;
              --star-font-color: #e0c537;
              --ghost-font-color: #495d68;
            }
          }

          /** Component styling **/
          :host {
            border-bottom: 3px solid var(--pr-border-color);
            display: block;
            padding: 14px 12px 20px 12px;
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .pr-title {
            display: inline-block;
            font-size: 20px;
            margin-top: 6px;
            margin-bottom: 12px;
          }
          :host .pr-title-name {
            color: var(--g-font-color);
            line-height: 24px;
            word-break: break-word;
          }

          :host .pr-container--draft .pr-title {
            filter: saturate(0.4);
          }
          :host .pr-container--draft .pr-title-name {
            opacity: 0.7;
          }

          :host .pr-meta {
            color: var(--dimmed-font-color);
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            font-size: 13px;
          }

          :host .pr-milestone-value {
            font-weight: 700;
          }

          :host .pr-time {

          }
          :host .pr-time-value {
            border-bottom: 1px dashed var(--g-font-color);
            cursor: help;
            font-weight: 700;
          }

          :host .pr-author {

          }
          :host .pr-author-value {

          }
          :host .pr-author-value--hot:before {
            content: "★";
            color: var(--star-font-color);
          }
          :host .pr-author-value--ghost {
            color: var(--ghost-font-color);
            font-weight: 600;
          }

          :host .pr-review {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-top: 14px;
          }

          :host .pr-review-team {
            color: var(--light-font-color);
            white-space: nowrap;
          }
          :host .pr-review-team + .pr-review-team:before {
            content: "· ";
            white-space: break-spaces;
          }

          @media only screen and (max-width: 900px) {
            :host {
              padding: 14px 0 20px 0;
            }
            :host .pr-meta {
              flex-wrap: wrap;
            }
          }
        `;
    }

    @property({ type: String }) id = '';
    @property({ type: String }) title = '';
    @property({ type: String, reflect: true }) url = '';
    @property({ type: String, reflect: true }) diff_url = '';
    @property({ type: String, reflect: true }) patch_url = '';
    @property({ type: Boolean }) draft = false;
    @property({ type: String, reflect: true }) milestone = '';
    @property({ type: String, reflect: true }) branch = '';
    @property({ type: String }) created_at = '';
    @property({ type: String }) updated_at = '';
    @property({ type: Object }) author = null;

    render(){
        const authorClassList = [ "pr-author-value" ];
        if (this.author.pull_count > 40) {
            authorClassList.push("pr-author-value--hot");
        }
        if (this.author.id === "") {
            authorClassList.push("pr-author-value--ghost");
        }

        return html`
            <div class="pr-container ${(this.draft ? "pr-container--draft" : "")}">
                <a
                    class="pr-title"
                    href="${this.url}"
                    target="_blank"
                >
                    <span class="pr-title-id">#${this.id}</span> <span class="pr-title-name">${this.title}</span>
                </a>

                <div class="pr-meta">
                    <div class="pr-milestone">
                        <div>
                            <span>milestone: </span>
                            ${(this.milestone != null) ? html`
                                <a
                                    href="${this.milestone.url}"
                                    target="_blank"
                                >
                                    ${this.milestone.title}
                                </a>
                            ` : html`
                                <span>none</span>
                            `}
                        </div>
                        <div>
                            <span>branch: </span>
                            <span class="pr-milestone-value">
                                ${this.branch}
                            </span>
                        </div>
                    </div>

                    <div class="pr-people">
                        <div class="pr-author">
                            <span>author: </span>
                            <a
                                class="${authorClassList.join(" ")}"
                                href="https://github.com/godotengine/godot/pulls/${this.author.user}"
                                target="_blank"
                                title="Open ${this.author.pull_count} ${(this.author.pull_count > 1) ? 'PRs' : 'PR'} by ${this.author.user}"
                            >
                                ${this.author.user}
                            </a>
                        </div>
                    </div>

                    <div class="pr-timing">
                        <div class="pr-time">
                            <span>created: </span>
                            <span
                                class="pr-time-value"
                                title="${greports.format.formatTimestamp(this.created_at)}"
                            >
                                ${greports.format.formatDate(this.created_at)}
                            </span>
                        </div>
                        <div class="pr-time">
                            <span>updated: </span>
                            <span
                                class="pr-time-value"
                                title="${greports.format.formatTimestamp(this.updated_at)}"
                            >
                                ${greports.format.formatDate(this.updated_at)}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="pr-review">
                    <div class="pr-download">
                        <span>download changeset: </span>
                        <a
                            href="${this.diff_url}"
                            target="_blank"
                        >
                            diff
                        </a> |
                        <a
                            href="${this.patch_url}"
                            target="_blank"
                        >
                            patch
                        </a>
                    </div>

                </div>
            </div>
        `;
    }
}