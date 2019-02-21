import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {IronValidatableBehavior} from '@polymer/iron-validatable-behavior/iron-validatable-behavior.js';
import {EventsTargetMixin} from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import {ApiFormMixin} from '@api-components/api-form-mixin/api-form-mixin.js';
import {HeadersParserMixin} from '@advanced-rest-client/headers-parser-mixin/headers-parser-mixin.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {AmfHelperMixin} from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/polymer/lib/utils/render-status.js';
import '@api-components/api-view-model-transformer/api-view-model-transformer.js';
import '@api-components/raml-aware/raml-aware.js';
import '@api-components/api-headers-form/api-headers-form.js';
import '@advanced-rest-client/code-mirror/code-mirror.js';
import '@advanced-rest-client/code-mirror-hint/code-mirror-hint.js';
import '@advanced-rest-client/arc-icons/arc-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@api-components/clipboard-copy/clipboard-copy.js';
import '@api-components/api-form-mixin/api-form-styles.js';
/**
 * `api-headers-editor`
 * An element to render headers edior based on AMF data model.
 *
 * By default it renders headers form. The user has an option to switch to
 * source editing mode. `code-mirror` element is used in the later case.
 *
 * ## AMF data model
 *
 * This element renders pre-configured form of headers based on
 * [AMF's](https://github.com/mulesoft/amf) json/ld data model.
 * From the model select `http://raml.org/vocabularies/http#header`
 * node which contains list of headers defined for current object
 * (it can be method, trait, security scheme etc).
 * The model is resolved to internal data model by `api-view-model-transformer`
 * element.
 *
 * If the element is used without AMF model `allowCustom` property must be
 * set or otherwise user won't be able to add new header to the editor.
 *
 * ### Example
 *
 * ```html
 * <api-headers-editor id="editor" allow-disable-params></api-headers-editor>
 * <script>
 * let data = await getAmfModel();
 * editor.amfModel = data;
 * data = data[0]['http://raml.org/vocabularies/document#encodes'][0];
 * data = data['http://raml.org/vocabularies/http#endpoint'][0];
 * data = data['http://www.w3.org/ns/hydra/core#supportedOperation'][0];
 * data = data['http://www.w3.org/ns/hydra/core#expects'][0];
 * data = data['http://raml.org/vocabularies/http#header'];
 * (first endpoint, first method, headers array)
 * editor.amfHeaders = data;
 * editor.addEventListener('value-changed', (e) => console.log(e.detail.value));
 * < /script>
 * ```
 *
 * ### Example without AMF
 *
 * ```html
 * <api-headers-editor id="editor" allow-disable-params allow-custom></api-headers-editor>
 * <script>
 * editor.addEventListener('value-changed', (e) => console.log(e.detail.value));
 * < /script>
 * ```
 *
 * ## Setting value when model is set
 *
 * Model values has priority over value set on the editor.
 * If `amfModel` is set and value has been altered programatically there
 * are two possible outcomes:
 *
 * 1) If `allowDisableParams` is set, model values are automatically
 * disabled if model item is not in the value
 * 2) If `allowDisableParams` is not set, model values are always
 * added to generated values. Or rather new value is added to the existing
 * model as custom values.
 *
 * @customElement
 * @memberof ApiElements
 * @demo demo/simple.html Simple headers editor
 * @demo demo/raml.html With AMF model
 * @appliesMixin ArcBehaviors.HeadersParserBehavior
 * @appliesMixin ApiFormMixin
 * @appliesMixin ApiFormMixin
 * @polymerBehavior Polymer.IronValidatableBehavior
 * @appliesMixin AmfHelperMixin
 */
class ApiHeadersEditor extends mixinBehaviors(
    [IronValidatableBehavior],
    ApiFormMixin(EventsTargetMixin(
      HeadersParserMixin(AmfHelperMixin(PolymerElement))))) {
  static get template() {
    return html`
    <style include="api-form-styles">
    :host {
      display: block;
      position: relative;
      @apply --api-headers-editor;
    }

    paper-icon-button[active] {
      background-color: var(--api-headers-editor-panel-button-active-background-color, var(--raml-body-editor-panel-button-active-background-color, #e0e0e0));
      border-radius: 50%;
      @apply --raml-body-editor-panel-button-active;
      @apply --api-headers-editor-panel-button-active;
    }
    </style>
    <template is="dom-if" if="[[aware]]">
      <raml-aware raml="{{amfModel}}" scope="[[aware]]"></raml-aware>
    </template>
    <api-view-model-transformer amf-model="[[amfModel]]" shape="[[amfHeaders]]" view-model="{{viewModel}}" id="transformer" events-target="[[_transformerTarget]]" no-docs="[[noDocs]]"></api-view-model-transformer>
    <div class="content">
      <div class="editor-actions">
        <paper-icon-button class="action-icon copy-icon" icon="arc:content-copy" on-tap="_copyToClipboard" title="Copy headers value to clipboard"></paper-icon-button>
        <paper-icon-button class="action-icon" icon="arc:code" toggles="" active="{{sourceMode}}" title="Toggle source edit mode"></paper-icon-button>
        <slot name="content-actions"></slot>
      </div>
      <div id="editor">
        <template is="dom-if" if="[[!sourceMode]]" restamp="true">
          <api-headers-form model="{{viewModel}}" narrow="[[narrow]]" allow-custom="[[allowCustom]]" allow-disable-params="[[allowDisableParams]]" allow-hide-optional="[[allowHideOptional]]" data-headers-panel="" on-value-changed="_editorValueChanged" invalid="{{invalid}}" no-docs="[[noDocs]]" readonly="[[readonly]]"></api-headers-form>
        </template>
      </div>
    </div>
    <clipboard-copy content="[[value]]"></clipboard-copy>
`;
  }

  static get is() {return 'api-headers-editor';}
  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: String,
      /**
       * Generated AMF json/ld model form the API spec.
       * The element assumes the object of the first array item to be a
       * type of `"http://raml.org/vocabularies/document#Document`
       * on AMF vocabulary.
       *
       * @type {Object|Array}
       */
      amfModel: Object,
      /**
       * List of headers defined in AMF model to render.
       */
      amfHeaders: Array,
      /**
       * Headers value.
       */
      value: {
        type: String,
        notify: true,
        observer: '_valueChanged'
      },
      /**
       * Generated view model fore the headers from `amfModel`.
       * This is automatically set when `amfModel` is set.
       */
      viewModel: Array,
      /**
       * Value of a Content-Type header.
       * When this value change then editor update the value for the content type. However,
       * to change a single header value, please, use `request-headers-changed` event with `name`
       * and `value` properties set on the detail object.
       *
       * @type {Stirng}
       */
      contentType: {
        type: String,
        notify: true,
        observer: '_onContentTypeChanged'
      },
      // When set to true then the source edit mode is enabled
      sourceMode: {
        type: Boolean,
        observer: '_sourceModeChanged'
      },
      // Events target for tranformer
      _transformerTarget: {
        type: Object,
        value: function() {
          return this;
        }
      },
      // Regexp to search for content type value
      _contentTypeRe: {
        type: Object,
        value: function() {
          return /^[\t\r]*content\-type[\t\r]*:[\t\r]*([^\n]*)$/gim;
        }
      },
      /**
       * Prohibits rendering of the documentation (the icon and the
       * description).
       * Note, Set is separately for `api-view-model-transformer`
       * component as this only affects "custom" items.
       */
      noDocs: Boolean,
      /**
       * When set the editor is in read only mode.
       */
      readonly: {
        type: Boolean,
        observer: '_readonlyChanged'
      },
      /**
       * Automatically validates headers agains AMF model when value change.
       * Note, it only works with form editor.
       */
      autoValidate: Boolean
    };
  }
  /**
   * Reference to currently rendered headers editor.
   * @return {HTMLElement}
   */
  get currentPanel() {
    if (!this.shadowRoot) {
      return;
    }
    const panel = this.shadowRoot.querySelector('code-mirror');
    if (panel) {
      return panel;
    }
    return this.shadowRoot.querySelector('api-headers-form');
  }

  /**
   * @constructor
   */
  constructor() {
    super();
    this._editorValueChanged = this._editorValueChanged.bind(this);
    this._cmKeysHandler = this._cmKeysHandler.bind(this);
    this._headersChangedHandler = this._headersChangedHandler.bind(this);
    this._headerChangedHandler = this._headerChangedHandler.bind(this);
    this._contentTypeChangedHandler = this._contentTypeChangedHandler.bind(this);
    this._headerDeletedHandler = this._headerDeletedHandler.bind(this);
  }

  _attachListeners(node) {
    node.addEventListener('request-headers-changed', this._headersChangedHandler);
    node.addEventListener('request-header-changed', this._headerChangedHandler);
    node.addEventListener('content-type-changed', this._contentTypeChangedHandler);
    node.addEventListener('request-header-deleted', this._headerDeletedHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('request-headers-changed', this._headersChangedHandler);
    node.removeEventListener('request-header-changed', this._headerChangedHandler);
    node.removeEventListener('content-type-changed', this._contentTypeChangedHandler);
    node.removeEventListener('request-header-deleted', this._headerDeletedHandler);
  }
  /**
   * Handler for `sourceMode` change.
   *
   * Opens desired editr.
   *
   * @param {Boolean} isSource
   */
  _sourceModeChanged(isSource) {
    if (isSource) {
      this._attachSourceEditor();
      setTimeout(() => {
        const panel = this.currentPanel;
        panel.setOption('extraKeys', {
          'Ctrl-Space': this._cmKeysHandler
        });
        panel.value = this.modelToValue(this.viewModel);
      }, 50);
    } else {
      const panel = this.currentPanel;
      if (panel) {
        panel.removeEventListener('value-changed', this._editorValueChanged);
        panel.parentNode.removeChild(panel);
      }
      this._modelFromValue();
    }

    const ev = new CustomEvent('send-analytics', {
      detail: {
        type: 'event',
        category: 'Usage',
        action: 'Click',
        label: 'Toggle source mode ' + String(isSource),
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(ev);
  }

  _attachSourceEditor() {
    const cm = document.createElement('code-mirror');
    cm.mode = 'http-headers';
    cm.setAttribute('data-headers-panel', true);
    cm.addEventListener('value-changed', this._editorValueChanged);
    if (this.readonly) {
      cm.readOnly = true;
    }
    this.$.editor.appendChild(cm);
  }
  /**
   * Sets current value of `readonly` on the source editor.
   * @param {Boolean} value
   */
  _readonlyChanged(value) {
    if (!this.sourceMode) {
      return;
    }
    const panel = this.currentPanel;
    if (!panel) {
      return;
    }
    panel.readOnly = value;
  }

  /**
   * Updates the value when current editor's value change.
   *
   * @param {CustomEvent} e
   */
  _editorValueChanged(e) {
    const value = e.detail.value;
    if (value !== this.value) {
      this._innerEditorValueChanged = true;
      this.set('value', value);
      this._innerEditorValueChanged = false;
    }
  }
  /**
   * Creates a headers string from a model.
   *
   * @param {?Array} model Optional, model to process. If not set it uses
   * `this.viewModel`
   * @return {String} Generated headers
   */
  modelToValue(model) {
    if (!model) {
      model = this.viewModel;
    }
    if (!model || !model.length) {
      return '';
    }
    const data = [];
    const disbleAllowed = this.allowDisableParams;
    model.forEach((item) => {
      if (!item || (disbleAllowed && item.schema && item.schema.enabled === false)) {
        return;
      }
      data.push({
        name: item.name,
        value: item.value
      });
    });
    return this.headersToString(data);
  }
  /**
   * Code mirror's ctrl+space key handler.
   * Opens headers fill support.
   *
   * @param {Object} cm Code mirror instance.
   */
  _cmKeysHandler(cm) {
    /* global CodeMirror */
    CodeMirror.showHint(cm, CodeMirror.hint['http-headers'], {
      container: this.currentPanel
    });
  }
  /**
   * Called when switching from source view to form view.
   * Updates view model with values defined in text editor.
   *
   * Only headers existing in `value` are going to be present in the model.
   * Otherwise headers will be disabled.
   *
   * It does nothing if `value` or `viewModel` is not defined.
   *
   * @param {?String} value
   */
  _modelFromValue(value) {
    value = value || this.value;
    if (value === undefined) {
      if (!this.model) {
        return;
      } else {
        value = '';
      }
    }
    let model = this.viewModel;
    if (!model) {
      model = [];
    }
    const parsedValue = this.filterHeaders(this.headersToJSON(String(value)));
    const tmp = {};
    const appendCustom = [];
    const disbleAllowed = this.allowDisableParams;
    // updates model value
    for (let i = 0, len = parsedValue.length; i < len; i++) {
      const item = parsedValue[i];
      const index = this._findModelIndex(model, item.name);
      if (index === -1) {
        appendCustom.push(this.createCustom(item));
      } else {
        tmp[item.name] = true;
        if (model[index].value !== item.value) {
          if (model[index].schema.isArray) {
            this.set(['viewModel', index, 'value'], item.value.split(','));
          } else {
            this.set(['viewModel', index, 'value'], item.value);
          }
        }
        if (!model[index].schema.enabled) {
          this.set(['viewModel', index, 'schema', 'enabled'], true);
        }
      }
    }
    // Disables / removes not existing values.
    for (let i = model.length - 1; i >= 0; i--) {
      if (model[i].name in tmp) {
        continue;
      }
      if (model[i].schema.isCustom) {
        this.splice('viewModel', i, 1);
      } else if (disbleAllowed) {
        this.set(['viewModel', i, 'schema', 'enabled'], false);
      } else {
        if (model[i].schema.isArray) {
          this.set(['viewModel', i, 'value'], []);
        } else {
          this.set(['viewModel', i, 'value'], '');
        }
      }
    }
    if (!this.viewModel || !this.viewModel.length) {
      this.viewModel = appendCustom;
    } else {
      appendCustom.forEach((item) => this.push('viewModel', item));
    }
  }
  /**
   * Finds item position in model by name.
   *
   * @param {Array} model Model items
   * @param {String} name Header name to search for
   * @return {Number} Items position or `-1` if not found.
   */
  _findModelIndex(model, name) {
    for (let i = 0, len = model.length; i < len; i++) {
      if (model[i].name === name) {
        return i;
      }
    }
    return -1;
  }
  /**
   * Creates a custom header model item.
   *
   * @param {Object} defaults Default data
   * @return {Object} View model item
   */
  createCustom(defaults) {
    const data = Object.assign({}, defaults);
    if (!data.schema) {
      data.schema = {};
    }
    data.schema.isCustom = true;
    if (!data.schema.type) {
      data.schema.type = 'string';
    }
    if (!data.schema.enabled) {
      data.schema.enabled = true;
    }
    if (!data.schema.inputLabel) {
      data.schema.inputLabel = 'Header value';
    }
    this.$.transformer.buildProperty(data);
    return data;
  }

  /**
   * Handler tor the `request-headers-changed` event.
   * Updates the editor value to the value of the event detail object.
   * @param {CustomEvent} e
   */
  _headersChangedHandler(e) {
    if (e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    const value = e.detail.value;
    this._setValues(value);
  }
  /**
   * Handler for the `request-header-changed` event.
   * It updates value for a single header.
   * @param {CustomEvent} e
   */
  _headerChangedHandler(e) {
    if (e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    const name = e.detail.name;
    if (!name) {
      console.warn('request-header-changed fired without the name.');
      return;
    }
    const value = e.detail.value;
    const arr = this.headersToJSON(this.value);
    let updated = false;
    for (let i = 0, len = arr.length; i < len; i++) {
      if (arr[i].name.toLowerCase() === name.toLowerCase()) {
        arr[i].value = value;
        updated = true;
        break;
      }
    }
    if (!updated) {
      arr.push({
        name: name,
        value: value
      });
    }
    const headers = this.headersToString(arr);
    this._setValues(headers);
  }
  /**
   * Handler for `content-type-changed` event.
   * Uppdates it's value if from external source.
   *
   * @param {CustomEvent} e
   */
  _contentTypeChangedHandler(e) {
    if (e.composedPath()[0] === this || e.defaultPrevented) {
      return;
    }
    this.__cancelContentTypeNotification = true;
    this.set('contentType', e.detail.value);
    this.__cancelContentTypeNotification = false;
  }
  /**
   * Handler for `request-header-deleted` custom event.
   * Deletes header from the editor.
   * @param {CustomEvent} e
   */
  _headerDeletedHandler(e) {
    if (e.defaultPrevented) {
      return;
    }
    const name = e.detail.name;
    if (!name) {
      console.warn('request-header-deleted fired without the name.');
      return;
    }
    const arr = this.headersToJSON(this.value);
    let updated = false;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].name.toLowerCase() === name.toLowerCase()) {
        arr.splice(i, 1);
        updated = true;
        break;
      }
    }
    if (!updated) {
      return;
    }
    const headers = this.headersToString(arr);
    this._setValues(headers);
  }
  /**
   * Detects and sets content type value from changed headers value.
   *
   * @param {String} value Headers new value.
   */
  _detectContentType(value) {
    if (!value) {
      value = '';
    }
    this._contentTypeRe.lastIndex = 0;
    const matches = this._contentTypeRe.exec(value);
    let ctValue;
    if (!matches) {
      ctValue = '';
    } else {
      ctValue = matches[1];
    }
    if (!ctValue) {
      if (this.contentType) {
        this.set('contentType', undefined);
      }
    } else {
      ctValue = ctValue.trim();
      if (this.contentType !== ctValue) {
        this.set('contentType', ctValue);
      }
    }
  }
  /**
   * Called by CodeMirror editor.
   * When something change n the headers list, detect content type header.
   * @param {String} value
   */
  _valueChanged(value) {
    if (this.autoValidate) {
      this.validate();
    }
    this._detectContentType(value);
    if (this._cacncelChangeEvent) {
      if (!this._innerEditorValueChanged) {
        this._modelFromValue(value);
      }
      return;
    }
    if (this._innerEditorValueChanged) {
      if (this.readonly) {
        return;
      }
      this.dispatchEvent(new CustomEvent('request-headers-changed', {
        detail: {
          value: value
        },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
    } else {
      this._modelFromValue(value);
    }
  }

  _onContentTypeChanged(currentCt) {
    if (this.readonly) {
      return;
    }
    if (!currentCt) {
      this._notifyContentType('');
      return;
    }
    const arr = this.headersToJSON(this.value);
    let updated = false;
    for (let i = 0, len = arr.length; i < len; i++) {
      if (arr[i].name.toLowerCase() !== 'content-type') {
        continue;
      }
      updated = true;
      if (arr[i].value !== currentCt) {
        arr[i].value = currentCt;
      }
      break;
    }
    if (!updated) {
      arr.push({
        name: 'Content-Type',
        value: currentCt
      });
    }
    const headers = this.headersToString(arr);
    if (!this._innerEditorValueChanged) {
      this._setValues(headers);
      this._modelFromValue(headers);
    }
    this._notifyContentType(currentCt);
  }

  _notifyContentType(type) {
    if (this.__cancelContentTypeNotification) {
      return;
    }
    const ev = new CustomEvent('content-type-changed', {
      detail: {
        value: type
      },
      cancelable: false,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(ev);
  }
  /**
   * Updates `value` when new value is computed by the editor.
   *
   * @param {String} value A value to set.
   */
  _setValues(value) {
    this._cacncelChangeEvent = true;
    this.set('value', value);
    this._cacncelChangeEvent = false;
    if (!this._innerEditorValueChanged && this.sourceMode) {
      const panel = this.currentPanel;
      if (panel) {
        panel.value = value;
      }
    }
  }
  /**
   * Coppies current response text value to clipboard.
   */
  _copyToClipboard() {
    const button = this.shadowRoot.querySelector('.copy-icon');
    const copy = this.shadowRoot.querySelector('clipboard-copy');
    if (copy.copy()) {
      button.icon = 'arc:done';
    } else {
      button.icon = 'arc:error';
    }
    setTimeout(() => {
      this._resetCopyButtonState(button);
    }, 1000);
    const ev = new CustomEvent('send-analytics', {
      detail: {
        type: 'event',
        category: 'Usage',
        action: 'Click',
        label: 'Headers editor clipboard copy',
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(ev);
  }

  _resetCopyButtonState(button) {
    button.icon = 'arc:content-copy';
  }

  // Overidden from Polymer.IronValidatableBehavior. Will set the `invalid`
  // attribute automatically, which should be used for styling.
  _getValidity() {
    if (this.sourceMode || !this.shadowRoot) {
      return true;
    }
    const form = this.shadowRoot.querySelector('api-headers-form');
    return form ? form.validate() : true;
  }
  /**
   * Refreshes the CodeMirror editor when in `sourceMode`.
   */
  refresh() {
    if (!this.sourceMode) {
      return;
    }
    const panel = this.currentPanel;
    panel.refresh();
  }
}

window.customElements.define(ApiHeadersEditor.is, ApiHeadersEditor);
