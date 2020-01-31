## Slate Editor Mini Project

Install:

`yarn`

Run:

`yarn start`

### Features:

Slate is an extensible Rich Text library similar to Draftjs and Quill. See
https://github.com/ianstormtaylor/slate

### Task
Build a custom Slate editor with the following features:

1. A toolbar at the top with the standard rich text see https://www.slatejs.org/#/rich-text

2. Images:
   - Image linking toolbar see https://www.slatejs.org/#/images
   - Image upload with button in toolbar, when clicked shows a file browser.
   - Support only valid image file formats

3. Lists:
    - Ordered and unordered lists with tab support (e.g. tabbing an unordered or
ordered list will indent it up to 3 levels. E.g: Level 2 Level 3
    - Support for Shift + Tab (goes down a tab indent level)
    - Save/Cancel functionality
    - Save - stores new new editor content
    - Cancel - restores to the old saved content
    
4. A configurable limit on the number of top-level block nodes in the editor, also support
‘unlimited’, default. Grey out / prevent the save functionality if the number of block nodes
is greater than the limit. May have to implement a custom plugin. See
https://docs.slatejs.org/guides/data-model#documents-and-nodes and
https://www.slatejs.org/#/plugins

5. Store the editor content and images uploaded in browser local storage.


## Technologies

React.js, Slate plugin
