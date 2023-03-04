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
            position: relative;
            flex-grow: 1;
          }

          :host .pull-filter-value input {
            background: var(--g-background-extra2-color);
            border: 2px solid var(--g-background-extra-color);
            border-radius: 4px 4px;
            color: var(--g-font-color);
            font-size: 16px;
            padding: 8px 48px 8px 12px;
            width: calc(100% - 60px);
          }

          :host .pull-filter-reset {
            position: absolute;
            right: -3px;
            top: 0;
            bottom: 0;
            width: 36px;
            background-color: var(--g-background-extra-color);
            background-image: url('remove.svg');
            background-repeat: no-repeat;
            background-position: center;
            background-size: 20px 20px;
            border: 2px solid var(--g-background-extra-color);
            border-left: none;
            border-radius: 0 4px 4px 0;
            cursor: pointer;
          }
          :host .pull-filter-reset:hover {
            background-color: var(--g-background-extra2-color);
          }

          :host .pull-filter-resolved {
            font-weight: 600;
            padding: 0 8px;
            min-width: 60px;
          }

          @media only screen and (max-width: 900px) {
            :host .pull-filter {
                padding: 0 12px;
            }
          }
        `;
    }

    constructor() {
        super();

        this._rawValue = "";
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
        this._rawValue = event.target.value.trim();
        
        if (this._rawValue !== "") {
            this._resolvedValue = this._parsePullNumber(this._rawValue);
        }

        this.dispatchEvent(greports.util.createEvent("filterchanged", {
            "pull": this._resolvedValue,
        }));
        this.requestUpdate();
    }

    _filterReset(event) {
        this._rawValue = "";
        this._resolvedValue = "";

        this.dispatchEvent(greports.util.createEvent("filterchanged", {
            "pull": this._resolvedValue,
        }));
        this.requestUpdate();
    }

    render(){
        return html`
            <div class="pull-filter">
                <span class="pull-filter-label">Input PR link or number:</span>
                <div class="pull-filter-value">
                    <input
                        type="text"
                        .value="${this._rawValue}"
                        @change="${this._filterChanged.bind(this)}"
                    />
                    <div
                        class="pull-filter-reset"
                        @click="${this._filterReset.bind(this)}"
                    ></div>
                </div>
                <span class="pull-filter-resolved">
                    ${(this._resolvedValue !== "" ? "#" + this._resolvedValue : "")}
                </span>
            </div>
        `;
    }
}
