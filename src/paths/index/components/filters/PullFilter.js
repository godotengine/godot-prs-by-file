import { LitElement, html, css, customElement, property } from 'lit-element';

const GH_PULL_URL_RE = RegExp("^https://github.com/([a-z0-9-_]+/[a-z0-9-_]+)/pull/([0-9]+)$", "i");
const GH_PULL_REF_RE = RegExp("^([a-z0-9-_]+/[a-z0-9-_]+)?#([0-9]+)$", "i");
const GH_PULL_NUMBER_RE = RegExp("^[#]?([0-9]+)$", "i");

@customElement('gr-pull-filter')
export default class PullFilter extends LitElement {
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

          :host .pull-filter {
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: center;
            margin-top: 24px;
          }

          :host .pull-filter-value {
            background: var(--g-background-extra2-color);
            border: 2px solid var(--g-background-extra-color);
            border-radius: 4px 4px;
            color: var(--g-font-color);
            font-size: 16px;
            flex-grow: 1;
            padding: 8px 12px;
          }

          :host .pull-filter-resolved {
            font-weight: 600;
            padding: 0 8px;
            min-width: 60px;
          }

          @media only screen and (max-width: 900px) {

          }
        `;
    }

    constructor() {
        super();

        this._resolvedValue = "";
    }

    _parsePullNumber(value) {
        let match = value.match(GH_PULL_URL_RE);
        if (match) {
            return match[2];
        }

        match = value.match(GH_PULL_REF_RE);
        if (match) {
            return match[2];
        }

        match = value.match(GH_PULL_NUMBER_RE);
        if (match) {
            return match[1];
        }

        return "00000";
    }

    _filterChanged(event) {
        this._resolvedValue = "";
        const rawValue = event.target.value.trim();
        
        if (rawValue !== "") {
            this._resolvedValue = this._parsePullNumber(rawValue);
        }

        this.dispatchEvent(greports.util.createEvent("filterchanged", {
            "pull": this._resolvedValue,
        }));
        this.requestUpdate();
    }

    render(){
        return html`
            <div class="pull-filter">
                <span class="pull-filter-label">Input PR link or number:</span>
                <input
                    class="pull-filter-value"
                    type="text"
                    @change="${this._filterChanged.bind(this)}"
                />
                <span class="pull-filter-resolved">
                    ${this._resolvedValue}
                </span>
            </div>
        `;
    }
}
