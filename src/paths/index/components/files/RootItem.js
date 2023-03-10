import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-root-item')
export default class RootItem extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --tab-hover-background-color: rgba(0, 0, 0, 0.14);
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --tab-hover-background-color: rgba(255, 255, 255, 0.14);
            }
          }

          /** Component styling **/
          :host {
            max-width: 240px;
          }

          :host .root-item {
            color: var(--g-font-color);
            cursor: pointer;
            display: flex;
            flex-direction: row;
            gap: 8px;
            padding: 6px 12px 6px 6px;
            align-items: center;
          }
          :host .root-item:hover {
            background-color: var(--tab-hover-background-color);
          }

          :host .root-icon {
            background-image: url('filesystem.svg');
            background-size: cover;
            border-radius: 2px;
            display: inline-block;
            width: 16px;
            height: 16px;
            min-width: 16px;
          }

          @media (prefers-color-scheme: light) {
            :host .root-icon {
              filter: brightness(0.5);
            }
          }

          :host .root-title {
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
          }

          :host .root-branch {
            color: var(--dimmed-font-color);
            flex-grow: 1;
            font-size: 13px;
            text-align: right;
          }

          @media only screen and (max-width: 900px) {
            :host .root-item {
              padding: 10px 16px 10px 12px;
            }

            :host .root-title,
            :host .root-branch {
              font-size: 16px;
            }
          }
        `;
    }

    @property({ type: String }) repository = "";
    @property({ type: String, reflect: true }) branch = "";

    render(){
        return html`
            <div class="root-item">
                <div class="root-icon"></div>
                <span class="root-title">
                    ${this.repository}
                </span>
                <span class="root-branch">
                    ${this.branch}
                </span>
            </div>
        `;
    }
}
