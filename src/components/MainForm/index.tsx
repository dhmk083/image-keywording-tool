import React from "react";
import { render } from "react-dom";
import Split from "react-split-pane";
import { remote, ipcRenderer } from "electron";
import {
  disposable,
  DomainError,
  staticProxy,
  handleGlobalError,
} from "@dhmk/utils";
import { Observer } from "@dhmk/atom-react";
import { observe } from "@dhmk/atom";

import { Button, ButtonGroup, Window, Toolbar } from "components/misc";
import OpenedImage from "components/OpenedImage";
import Editors from "components/Editors";
import Gallery from "components/Gallery";
import Keywording from "components/Keywording";
import Settings from "components/Settings";
import Toaster from "components/Toaster";
import createApp from "app";
import styles from "./styles.scss";
import "css/global.scss";

class App extends React.Component<any> {
  readonly app = staticProxy(createApp(), (t) => ({
    image: staticProxy(t.image, {
      load: async (path: string) => {
        if (!t.metadata.isSaved()) {
          const buttonIndex = remote.dialog.showMessageBoxSync({
            type: "warning",
            title: "Warning",
            message:
              "Metadata for the current file are not saved. Would you like to save it now?",
            buttons: ["Yes", "No"],
          });

          if (buttonIndex === 0) await this.writeTags();
        }

        t.image.load(path);
      },
    }),
  }));

  state = {
    isSettingsOpened: false,
  };

  componentDidMount() {
    Object.assign(window, { app: this.app });

    this.componentWillUnmount = disposable(
      observe(
        () =>
          (document.title = this.app.image.path() || "Image Keywording Tool")
      ),

      handleGlobalError((e) => {
        if (e instanceof DomainError) {
          const msg = (() => {
            switch (e.context) {
              case this.app.metadata:
                return `[metadata]: Cannot process file's metadata. Check \`exiftool\` path in settings. (${e.message})`;

              case this.app.keywording:
                return `[keywording]: Cannot fetch keywords from server. Check your Imagga/Shutterstock API keys in settings. (${e.message})`;

              default:
                return "";
            }
          })();

          msg && this.props.showError(msg);
        }
      })
    );
  }

  render() {
    const { image, metadata, gallery, keywording, settings } = this.app;

    return (
      <Window onDrop={this.onDrop} onDragOver={(ev) => ev.preventDefault()}>
        <Toolbar border="bottom">
          <div className={styles.header}>
            <Observer>
              {() => (
                <ButtonGroup>
                  <Button
                    onClick={this.openImage}
                    caption="Open"
                    icon="folder"
                  />
                  <Button
                    onClick={this.reloadImage}
                    caption="Reload"
                    icon="arrows-ccw"
                  />
                  <Button
                    onClick={this.writeTags}
                    disabled={!image.path()}
                    caption="Save"
                    icon="floppy"
                  />
                </ButtonGroup>
              )}
            </Observer>

            <div>
              <ButtonGroup>
                <Observer>
                  {() => (
                    <>
                      <Button
                        onClick={keywording.guessKeywords}
                        disabled={keywording.busy()}
                        caption="Imagga"
                        icon="tag"
                      />
                      <Button
                        onClick={keywording.guessKeywordsShutter}
                        disabled={keywording.busy()}
                        caption="Shutterstock"
                        icon="mouse"
                      />
                    </>
                  )}
                </Observer>
                <Button
                  onClick={this.openKeywordsPicker}
                  caption="Pick keywords"
                  icon="doc-text"
                />
                <Button
                  onClick={() => this.toggleSettings(true)}
                  caption="Settings"
                  icon="cog"
                />
              </ButtonGroup>
            </div>
          </div>
        </Toolbar>

        <div className={styles.split}>
          <Split
            minSize={0}
            maxSize={-1}
            defaultSize="60%"
            pane2Style={{ overflow: "hidden auto" }}
          >
            <Split
              split="horizontal"
              minSize={0}
              maxSize={-1}
              defaultSize="60%"
              pane2Style={{
                display: "flex",
                overflow: "hidden",
              }}
            >
              <OpenedImage image={image} />
              <Gallery gallery={gallery} image={this.app.image} />
            </Split>
            <div className={styles.panelRight}>
              <Editors metadata={metadata} />
              <hr />
              <Keywording
                keywording={keywording}
                onUseKeywords={(kws) =>
                  this.app.metadata.items.keywords.setValue(kws)
                }
              />
            </div>
          </Split>
        </div>

        {this.state.isSettingsOpened && (
          <Settings
            settings={settings}
            close={() => this.toggleSettings(false)}
          />
        )}
      </Window>
    );
  }

  onDrop = (ev) => {
    ev.preventDefault();

    const { items } = ev.dataTransfer;
    if (!items) return;

    const item = [...items].find((x) => x.kind === "file");
    if (!item) return;

    const file = item.getAsFile();
    this.app.image.load(file.path);
  };

  openImage = async () => {
    const result = await remote.dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Image Files", extensions: ["jpeg", "jpg", "png"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    const [path] = result.filePaths;
    path && this.app.image.load(path);
  };

  reloadImage = () => this.app.image.load(this.app.image.path());

  writeTags = () => this.app.metadata.save();

  toggleSettings = (open) => this.setState({ isSettingsOpened: open });

  openKeywordsPicker = () => ipcRenderer.send("open-keywords");
}

render(
  <Toaster>
    <App />
  </Toaster>,
  document.getElementById("app")
);
