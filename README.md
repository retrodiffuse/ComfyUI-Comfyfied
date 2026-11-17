# ComfyUI-Comfyfied

Comfyfied lets you customise the UI - hide unimportant buttons made by custom nodes and reposition everything else.

It ships the **KickRoCSS** colour palette and a layout editor. Frontend only: no nodes, no Python dependencies.

## Install

Search for **Comfyfied** in ComfyUI-Manager, or:

```sh
cd ComfyUI/custom_nodes
git clone https://github.com/retrodiffuse/ComfyUI-Comfyfied
```

Restart ComfyUI.

## Usage

1. Settings → Appearance → Color Palette → pick **KickRoCSS**. Layout changes only apply while this palette is active.
2. Open the editor with **Edit → Edit layout (KickRoCSS)** or `Ctrl+Alt+L`.

In the editor:

| Action | Does |
| --- | --- |
| Hover / tap | Highlight an element |
| Scroll wheel or **Parent** | Grow the highlight to the parent element |
| Click / tap | Select |
| Drag | Move |
| Drag bottom-right corner | Resize |
| Right-click | Reset the highlighted element |
| **Hide** / **Reset** | Hide or reset the selection |
| **Hidden** dropdown | Bring a hidden element back |
| **Reset all** | Undo every change |
| `Esc` / **Done** | Leave the editor |

Layouts are saved in your ComfyUI settings. A ComfyUI frontend update can change its markup, so a saved edit may need redoing afterwards.

## License

Apache-2.0. The theme is adapted from [KickRoCSS](https://github.com/retr0gr4d3/KickRoCSS).
