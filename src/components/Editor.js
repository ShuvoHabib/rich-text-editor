import React, { Component } from 'react';
import {Editor} from 'slate-react';
import {Block, Value} from 'slate';
import initialValue from './value';

document.title = 'Rich text Editor';

const storedValue = JSON.parse(localStorage.getItem('content'));
const value = Value.fromJSON(storedValue || initialValue);
const DEFAULT_NODE = 'paragraph';
const schema = {
    document: {
        last: {type: 'paragraph'},
        normalize: (editor, {code, node}) => {
            switch (code) {
                case 'last_child_type_invalid': {
                    const paragraph = Block.create('paragraph');
                    return editor.insertNodeByKey(node.key, node.nodes.size, paragraph);
                }
            }
        }
    },
    blocks: {
        image: {
            isVoid: true
        }
    }
};

function insertImage(editor, src, target) {
    if (target) {
        editor.select(target);
    }

    editor.insertBlock({
        type: 'image',
        data: {src}
    });
}

function convertTo(options) {
    let {key, type} = options;
    return {
        onKeyDown(event, editor, next) {
            if (!event.ctrlKey || event.key !== key) return next();
            event.preventDefault();
            editor.toggleMark(type);
        }
    };
}

const plugins = [
    convertTo({key: 'b', type: 'bold'}),
    convertTo({key: 'i', type: 'italic'}),
    convertTo({key: 'u', type: 'underline'}),
    convertTo({key: '-', type: 'strikethrough'}),
    convertTo({key: '`', type: 'code'})
];


export default class MyEditor extends Component {
    state = {
        value: value,
        nodeLimit: '',
        saveDisabled: false
    };

    onChange = ({value}) => {
        this.setState({value});
        let blockSize = this.editor.value.document.getBlocks().size;
        let {nodeLimit} = this.state;
        let saveDisabled;
        if (nodeLimit !== '' && blockSize > nodeLimit) {
            saveDisabled = true;
        } else {
            saveDisabled = false;
        }

        this.setState({saveDisabled});
    };

    ref = (editor) => (this.editor = editor);

    hasBlock = (type) => {
        let {value} = this.state;
        return value.blocks.some((node) => node.type === type);
    };

    renderConvertTo = (type, name) => {
        return (
            <button
                onMouseDown={(event) => this.activateMark(event, type)}
                title={type}>
                <i className={`fa ${name}`}/>
            </button>
        );
    };

    renderBlockTo = (type, name) => {
        let isActive = this.hasBlock(type);

        if (type === 'numbered-list' || type === 'bulleted-list') {
            let {value} = this.state;
            if (value.blocks.size > 0) {
                let parent = value.document.getParent(value.blocks.first().key);
                isActive = this.hasBlock('list-item') && parent && parent.type === type;
            }
        }
	
		if (name === 'H1' || name === 'H2') {
            return(
            <button title={type} onClick={(event) => this.activateBlock(event, type)}>
                {name}
            </button>)
        }
		
			if (type === 'imageBrowser') {
            return (
                <div className="upload-btn-wrapper">
                    <button title={type}>
                        <input
                            type="file"
                            id="input-button"
                            onChange={(event) => this.activateBlock(event, type)}
                        />
                        <i className={`fa ${name}`}/>
                    </button>
                </div>
            );
        }

        return (
            <button title={type} onClick={(event) => this.activateBlock(event, type)}>
                <i className={`fa ${name}`}/>
            </button>
        );
    };

    activateMark = (event, type) => {
        event.preventDefault();
        this.editor.toggleMark(type);
    };

    activateBlock = (event, type) => {
        event.preventDefault();

        const {editor} = this;
        const {value} = editor;
        const {document} = value;

        if (type === 'image') {
            // Show URl prompt
            let src = prompt('Please enter an image url: ');
            if (!src) return;
            editor.command(insertImage, src);
        }

        if (type === 'imageBrowser') {
            const getBase64 = (file) =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    const allowedTypes = [
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'image/gif'
                    ];
                    if (!allowedTypes.includes(file.type)) {
                        window.alert('Only jpg, png & gif image files are allowed!');
                        return;
                    }
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (error) => reject(error);
                });
            getBase64(event.currentTarget.files[0]).then((imageData) => {
                editor.command(insertImage, imageData);
            });
        }

        // Handle everything but list buttons.
        if (type !== 'bulleted-list' && type !== 'numbered-list') {
            const isActive = this.hasBlock(type);
            const isList = this.hasBlock('list-item');

            if (isList) {
                editor
                    .setBlocks(isActive ? DEFAULT_NODE : type)
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            } else {
                editor.setBlocks(isActive ? DEFAULT_NODE : type);
            }
        } else {
            // Handle the extra wrapping required for list buttons.
            const isList = this.hasBlock('list-item');
            const isType = value.blocks.some(
                (block) =>
                    !!document.getClosest(block.key, (parent) => parent.type === type)
            );

            if (isList && isType) {
                editor
                    .setBlocks(DEFAULT_NODE)
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            } else if (isList) {
                editor
                    .unwrapBlock(
                        type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
                    )
                    .wrapBlock(type);
            } else {
                editor.setBlocks('list-item').wrapBlock(type);
            }
        }
    };

    // Render Mark Function
    renderMark = (props, editor, next) => {
        let {mark, attributes, children} = props;
        switch (mark.type) {
            case 'bold':
                return <strong {...attributes}>{children}</strong>;
            case 'italic':
                return <em {...attributes}>{children}</em>;
            case 'underline':
                return <u {...attributes}>{children}</u>;
            case 'code':
                return <code {...attributes}>{children}</code>;
            case 'strikethrough':
                return <del {...attributes}>{children}</del>;
            default:
                return next();
        }
    };

    // Render Node Function
    renderNode = (props, editor, next) => {
        let {node, attributes, children} = props;
        switch (node.type) {
            case 'heading-one':
                return <h1 {...attributes}>{children}</h1>;
            case 'heading-two':
                return <h2 {...attributes}>{children}</h2>;
            case 'paragraph':
                return <p {...attributes}>{children}</p>;
            case 'blockquote':
                return <blockquote {...attributes}>{children}</blockquote>;
            case 'bulleted-list':
                return <ul {...attributes}>{children}</ul>;
            case 'numbered-list':
                return <ol {...attributes}>{children}</ol>;
            case 'list-item':
                return <li {...attributes}>{children}</li>;
            case 'code':
                return (
                    <pre {...attributes}>
            <code>{children}</code>
          </pre>
                );
             case 'image':
                let src = node.data.get('src');
                return <img src={src} {...attributes} />;

             default:
                return next();
        }
    };

    onKeyDown = (event, editor, next) => {
        // Do nothing if it's not a list item.
        let isList = this.hasBlock('list-item');

        if (!isList) {
            return next();
        }

        const {value} = editor;
        const {document} = value;

        const block = value.blocks.first();
        const parent = block ? document.getParent(block.key) : null;

        if (!event.shiftKey && event.key === 'Tab') {
            event.preventDefault();

            const type = !parent.type ? 'bulleted-list' : parent.type;

            // check whether it's already in 3rd level
            const depth = document.getDepth(block.key);
            if (depth > 3) {
                event.preventDefault();
                return next();
            }

            if (parent) {
                editor.setBlocks('list-item').wrapBlock(type);
            }
        }

        if (event.shiftKey && event.key == 'Tab') {
            event.preventDefault();

            // if multi level list items are selected for shift+tab, then return
            const firstBlockDepth = block && document.getDepth(block.key);
            let multiLevelSelected = false;
            value.blocks.map((currentKey) => {
                const currentDepth = document.getDepth(currentKey.key);
                multiLevelSelected = !!(firstBlockDepth !== currentDepth);
                return true;
            });
            if (multiLevelSelected) return next();

            // if first level list-items selected then, make paragraph
            if (parent && typeof parent.type === 'undefined') {
                editor
                    .setBlocks(DEFAULT_NODE)
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
                return next();
            }
            const depth = document.getDepth(block.key);

            const isActive =
                this.hasBlock('list-item') &&
                block &&
                (parent.type === 'numbered-list' || parent.type === 'bulleted-list');

            const onlyList = this.hasBlock('list-item');

            if (isActive) {
                editor
                    .setBlocks('list-item')
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            } else if (isActive && depth <= 2) {
                editor
                    .setBlocks(DEFAULT_NODE)
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            } else {
                editor
                    .setBlocks(DEFAULT_NODE)
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            }
            // Making sure we don't have an orphan list item
            if (onlyList && depth <= 2) {
                editor
                    .setBlocks(DEFAULT_NODE)
                    .unwrapBlock('list-item')
                    .unwrapBlock('bulleted-list')
                    .unwrapBlock('numbered-list');
            }
        }

        return next();
    };


    // Save content
    saveContent = () => {
        let content = JSON.stringify(this.state.value.toJSON());
        localStorage.setItem('content', content);
    };

    // Restore content
    restoreContent = () => {
        const storedValue = JSON.parse(localStorage.getItem('content'));
        let value = Value.fromJSON(storedValue || initialValue);
        this.setState({value});
    };

    updateNodeLimit = (event) => {
        event.preventDefault();
        let nodeLimit = parseInt(event.target.limit.value, 10);
        let blockSize = this.editor.value.document.getBlocks().size;
        let saveDisabled;
        if (nodeLimit !== 0 && blockSize > nodeLimit) {
            saveDisabled = true;
        } else {
            saveDisabled = false;
        }
        this.setState({nodeLimit, saveDisabled});
    };

    render() {
        return (
            <div id="editor-wrapper">
                <div id="header">
                    <div className="wrapper">
                        <div id="title-area">
                                <h2> Rich Text Editor</h2>
                        </div>
                        <div id="toolbar">
                            {this.renderConvertTo('bold', 'fa-bold')}
                            {this.renderConvertTo('italic', 'fa-italic')}
                            {this.renderConvertTo('underline', 'fa-underline')}
                            {this.renderBlockTo('heading-one', 'H1')}
                            {this.renderBlockTo('heading-two', 'H2')}
                            {this.renderBlockTo('paragraph', 'fa-paragraph')}
                            {this.renderBlockTo('blockquote', 'fa-quote-right')}
                            {this.renderBlockTo('numbered-list', 'fa-list-ol')}
                            {this.renderBlockTo('bulleted-list', 'fa-list-ul')}
                            {this.renderBlockTo('image', 'fa-image')}
                            {this.renderBlockTo('imageBrowser', 'fa-camera-retro')}
                        </div>
                    </div>
                </div>
                <div id="slate-editor" className="wrapper">
                    <Editor
                        ref={this.ref}
                        autoFocus
                        spellCheck={false}
                        placeholder="Start writing.."
                        value={this.state.value}
                        onChange={this.onChange}
                        onKeyDown={this.onKeyDown}
                        renderMark={this.renderMark}
                        renderNode={this.renderNode}
                        plugins={plugins}
                        schema={schema}
                    />
                </div>
                <div className="wrapper">
                    <div id="limiter">
                        <form onSubmit={this.updateNodeLimit} action="/" method="POST">
                            Node limit:&nbsp;
                            <input
                                name="limit"
                                type="number"
                                defaultValue={0}
                                className="input-number"
                            />
                            <button>Set</button>
                        </form>
                    </div>
                    <div id="menu">
                        <div className="buttons">
                            <button onClick={this.restoreContent}>Cancel</button>
                            <button
                                disabled={this.state.saveDisabled ? true : false}
                                onClick={this.saveContent}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
