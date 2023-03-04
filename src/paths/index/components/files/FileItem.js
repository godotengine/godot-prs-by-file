import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-file-item')
export default class FileItem extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --tab-hover-background-color: rgba(0, 0, 0, 0.14);
            --tab-active-background-color: #d6e6ff;
            --tab-active-border-color: #397adf;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --tab-hover-background-color: rgba(255, 255, 255, 0.14);
              --tab-active-background-color: #2c3c55;
              --tab-active-border-color: #397adf;
            }
          }

          /** Component styling **/
          :host {
            max-width: 240px;
          }

          :host .file-item {
            border-left: 5px solid transparent;
            color: var(--g-font-color);
            cursor: pointer;
            display: flex;
            flex-direction: row;
            gap: 8px;
            padding: 3px 12px;
            align-items: center;
          }
          :host .file-item:hover {
            background-color: var(--tab-hover-background-color);
          }
          :host .file-item--active {
            background-color: var(--tab-active-background-color);
            border-left: 5px solid var(--tab-active-border-color);
          }

          :host .file-icon {
            background-size: cover;
            border-radius: 2px;
            display: inline-block;
            width: 16px;
            height: 16px;
            min-width: 16px;
          }
          :host .file-icon--folder {
            background-image: url('folder.svg');
          }
          :host .file-icon--file {
            background-image: url('file.svg');
            filter: brightness(0.5);
          }

          @media (prefers-color-scheme: light) {
            :host .file-icon--folder {
              filter: brightness(0.5);
            }
            :host .file-icon--file {
              filter: none;
            }
          }

          :host .file-title {
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
          }

          :host .file-pull-count {
            color: var(--dimmed-font-color);
            flex-grow: 1;
            font-size: 13px;
            text-align: right;
          }
          :host .file-pull-count--hot {
            color: var(--g-font-color);
            font-weight: 700;
          }

          @media only screen and (max-width: 900px) {
            :host .file-item {
              padding: 6px 16px;
            }

            :host .file-title,
            :host .file-pull-count {
              font-size: 16px;
            }
          }
        `;
    }

    @property({ type: String }) path = "";
    @property({ type: String, reflect: true }) name = "";
    @property({ type: String, reflect: true }) type = "";
    @property({ type: Boolean, reflect: true }) active = false;
    @property({ type: Number }) pull_count = 0;

    render(){
        const classList = [ "file-item" ];
        if (this.active) {
            classList.push("file-item--active");
        }

        const iconClassList = [ "file-icon", "file-icon--" + this.type ];

        const countClassList = [ "file-pull-count" ];
        if (this.pull_count > 50) {
            countClassList.push("file-pull-count--hot");
        }

        return html`
            <div
              class="${classList.join(" ")}"
              title="${this.path}"
            >
                <div class="${iconClassList.join(" ")}"></div>
                <span class="file-title">
                    ${this.name}
                </span>
                <span class="${countClassList.join(" ")}">
                    ${this.pull_count}
                </span>
            </div>
        `;
    }
}
