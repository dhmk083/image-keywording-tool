import React from "react";
import cn from "classnames";
import { Render } from "@dhmk/react";

import useItemsSelector from "hooks/items-selector";
import useOuterBlur from "hooks/outer-blur";
import useAutoHeight from "hooks/auto-height";
import { Button, ButtonGroup, Input, Textarea } from "components/misc";
import styles from "./styles.scss";

type Props = {
  label: string;
  value: ReadonlyArray<string>;
  onChange: (value: ReadonlyArray<string>) => void;
  onSelect?: (selection: ReadonlyArray<string>) => void;
  className?: string;
  labelClassName?: string;
  getItemClassName?: (i: number) => string;
  custom?: React.ReactNode;
  canEdit: boolean;
  canAdd: boolean;
  canDelete: boolean;
};

type State = {
  modeEditAll: boolean;
  modeSelection: boolean;
  modeAdd: boolean;
  indexToEdit: number | null;
  itemToEdit: string;
  editAllValue: string;
};

export default class MultiEntryEditor extends React.Component<Props, State> {
  static defaultProps = {
    canEdit: true,
    canAdd: true,
    canDelete: true,
  };

  readonly state: State = {
    modeEditAll: false,
    modeSelection: false,
    modeAdd: false,
    indexToEdit: null,
    itemToEdit: "",
    editAllValue: "",
  };

  private _selector!: ReturnType<typeof useItemsSelector>;

  render() {
    const { label, value, custom, canAdd, className, labelClassName } =
      this.props;
    const { modeEditAll, editAllValue } = this.state;

    return (
      <Render>
        {() => {
          this._selector = useItemsSelector(() => value.length);

          React.useEffect(() => {
            this.props.onSelect?.(
              Array.from(this._selector.selection, (i) => this.props.value[i])
            );
          }, [this._selector.selection]);

          return (
            <div className={className}>
              <div className={styles.header}>
                <div className={cn(styles.label, labelClassName)}>
                  {label} ({value.length}):
                </div>
                <div className={styles.toolbar}>
                  {this.drawListControlPanel()}
                  {custom && (
                    <ButtonGroup className={styles.custom}>
                      {custom}
                    </ButtonGroup>
                  )}
                </div>
              </div>
              <Render>
                {() => (
                  <div
                    className={styles.items}
                    ref={useOuterBlur(this.clearModes)}
                  >
                    {modeEditAll ? (
                      <Render>
                        {() => (
                          <Textarea
                            className={styles.editAllInput}
                            ref={useAutoHeight()}
                            value={editAllValue}
                            onChange={this.handleEditAllChange}
                          />
                        )}
                      </Render>
                    ) : (
                      value.map((v, i) => this.drawItem(v, i))
                    )}
                  </div>
                )}
              </Render>
              <div className={styles.footer}>
                {canAdd && !modeEditAll && this.drawAddItemToolbar()}
              </div>
            </div>
          );
        }}
      </Render>
    );
  }

  drawListControlPanel() {
    const { canDelete, canEdit } = this.props;
    const { modeSelection, modeEditAll } = this.state;

    return (
      <Render>
        {() => (
          <ButtonGroup ref={useOuterBlur(this.clearSelection)}>
            {modeSelection && (
              <Button
                icon="check-square fas"
                title="Select all"
                onClick={this._selector.selectAll}
              />
            )}
            {modeSelection && (
              <Button
                icon="square fas"
                title="Select none"
                onClick={this._selector.selectNone}
              />
            )}
            <Button
              active={modeSelection}
              icon="check-square fas"
              title="Selection mode"
              onClick={this.toggleSelectionMode}
            />
            {canEdit && (
              <Button
                active={modeEditAll}
                icon={modeEditAll ? "doc-text-inv" : "doc-text"}
                title="Edit mode"
                onClick={this.toggleEditAll}
              />
            )}
            {canDelete && (
              <Button
                icon="trash-alt fas"
                title="Delete"
                onClick={() => {
                  if (confirm("Do you really want to delete these items?"))
                    this.deleteItems();
                }}
              />
            )}
          </ButtonGroup>
        )}
      </Render>
    );
  }

  drawAddItemToolbar() {
    const { modeAdd, itemToEdit } = this.state;

    if (modeAdd) {
      return (
        <Render>
          {() => (
            <div ref={useOuterBlur(this.clearModes)} className={styles.addItem}>
              <Input
                autoFocus
                value={itemToEdit}
                onChange={this.handleEdit}
                onKeyDown={this.handleAddItemKeyDown}
              />
              <Button
                icon="plus fas"
                title="Add item"
                disabled={!itemToEdit}
                onClick={this.addItem}
              />
            </div>
          )}
        </Render>
      );
    } else {
      return (
        <Button icon="plus fas" title="Add item" onClick={this.setAddMode} />
      );
    }
  }

  drawItem(value, index) {
    const { getItemClassName, canDelete, canEdit } = this.props;
    const { indexToEdit, itemToEdit } = this.state;
    const key = value;

    if (indexToEdit === index) {
      return (
        <div key={key} className={styles.itemEditor}>
          <Input
            className={getItemClassName?.(index)}
            autoFocus
            value={itemToEdit}
            onChange={(ev) => this.editItem(index, ev.target.value)}
            onKeyDown={(ev) => this.handleItemKeyDown(ev, index)}
            onBlur={() => this.commitItemEdit(index)}
          />
          {canDelete && (
            <Button
              icon="trash-alt fas"
              title="Delete"
              onClick={() => this.deleteItems([index])}
            />
          )}
        </div>
      );
    } else {
      return (
        <div
          key={key}
          className={cn(
            styles.item,
            { [styles.active]: this._selector.isSelected(index) },
            getItemClassName?.(index)
          )}
          onClick={(ev) => this.handleItemSelect(index, ev, canEdit)}
        >
          {value}
        </div>
      );
    }
  }

  handleEditAllChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      editAllValue: ev.target.value,
    });
  };

  handleEdit = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ itemToEdit: ev.target.value });
  };

  handleItemSelect = (i: number, ev: React.MouseEvent, canEdit: boolean) => {
    const forceSelection = ev.ctrlKey || ev.shiftKey;

    this.setState((old) => {
      const selecting = forceSelection || old.modeSelection;
      const newState = { ...old };

      if (selecting) {
        this._selector.select(i, ev);

        newState.modeSelection = true;
        newState.indexToEdit = null;
      } else {
        if (canEdit) {
          newState.indexToEdit = i;
          newState.itemToEdit = this.props.value[i];
        }
      }

      return newState;
    });
  };

  setAddMode = () => this.setState({ modeAdd: true, indexToEdit: null });

  clearModes = () =>
    this.setState({ modeAdd: false, indexToEdit: null, itemToEdit: "" });

  clearSelection = () => this.setState({ modeSelection: false });

  toggleEditAll = () => {
    this.setState(
      (old) => ({
        modeEditAll: !old.modeEditAll,
        modeSelection: false,
        modeAdd: false,
        indexToEdit: null,
        itemToEdit: "",
        editAllValue: old.modeEditAll
          ? old.editAllValue
          : this.props.value.join(", "),
      }),
      () =>
        !this.state.modeEditAll &&
        this.props.onChange(this.state.editAllValue.split(", ").filter(Boolean))
    );
  };

  toggleSelectionMode = () => {
    this.setState((old) => {
      if (old.modeSelection) this._selector.selectNone();

      return {
        modeSelection: !old.modeSelection,
        indexToEdit: null,
      };
    });
  };

  addItem = () => {
    this.props.onChange(this.props.value.concat(this.state.itemToEdit));
    this.setState({ itemToEdit: "" });
  };

  editItem = (i: number, value: string) => {
    this.setState({
      indexToEdit: i,
      itemToEdit: value,
    });
  };

  handleItemKeyDown = (ev: React.KeyboardEvent, i: number) => {
    if (ev.key === "Enter") this.commitItemEdit(i);
    if (ev.key === "Escape" || ev.key === "Enter") this.clearModes();
  };

  handleAddItemKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter") this.addItem();
    if (ev.key === "Escape") this.clearModes();
  };

  commitItemEdit = (i: number) => {
    this.props.onChange(
      this.props.value.map((x, k) => (k === i ? this.state.itemToEdit : x))
    );
  };

  deleteItems(indices?: ReadonlyArray<number>) {
    const shouldKeep = indices
      ? (_: any, i: number) => !indices.includes(i)
      : this._selector.selection.size
      ? (_: any, i: number) => !this._selector.isSelected(i)
      : () => false;

    const nextValue = this.props.value.filter(shouldKeep);

    this._selector.selectNone();
    this.props.onChange(nextValue);
    this.setState({
      itemToEdit: nextValue[this.state.indexToEdit ?? 0],
    });
  }
}
