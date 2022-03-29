import React from "react";
import cn from "classnames";
import { Render } from "@dhmk/react";

import Editable from "components/Editable";
import { Button, Spinner } from "components/misc";
import useItemsSelector from "hooks/items-selector";
import styles from "./styles.scss";

export default class SearchResults extends React.PureComponent<{
  busy?: boolean;
  items: ReadonlyArray<any>;
  page: number;
  totalPages: number;
  perPage: number;
  setPerPage(x: number): void;
  navigate(x: number): void;
  totalItems: number;
  onSelect?: (selection: any) => void;
}> {
  _selector!: ReturnType<typeof useItemsSelector>;

  render() {
    return (
      <Render>
        {() => {
          this._selector = useItemsSelector(() => this.props.items.length);

          React.useEffect(() => {
            this.props.onSelect?.(
              Array.from(this._selector.selection, (i) => this.props.items[i])
            );
          }, [this._selector.selection]);

          return (
            <div>
              {this.drawToolbar()}
              {this.drawItems()}
            </div>
          );
        }}
      </Render>
    );
  }

  drawToolbar() {
    const {
      busy,
      totalItems,
      page,
      totalPages,
      navigate,
      perPage,
      setPerPage,
    } = this.props;

    return (
      <div className={styles.toolbar}>
        <div className={styles.left}>
          <span>Total items: {totalItems}</span>
        </div>
        <div className={styles.right}>
          <Button
            disabled={busy || page <= 1}
            onClick={() => navigate(page - 1)}
            icon="left-open-big"
            title="Previous results"
          />
          <Editable
            type="number"
            disabled={busy}
            value={page.toString()}
            onChange={(x) => navigate(Number(x))}
          >
            <span className={styles.link}>
              Page {page} of {totalPages}
            </span>
          </Editable>
          <Button
            disabled={busy || page >= totalPages}
            onClick={() => navigate(page + 1)}
            icon="right-open-big"
            title="Next results"
          />
          <Editable
            type="number"
            disabled={busy}
            value={perPage.toString()}
            onChange={(x) => setPerPage(Number(x))}
          >
            <span className={styles.link}>Per Page {perPage}</span>
          </Editable>
        </div>
      </div>
    );
  }

  drawItems() {
    const { busy, items } = this.props;

    return (
      <div className={styles.items}>
        {busy && <Spinner />}
        {!busy && !items.length && <div>No results...</div>}
        {!busy &&
          items.map((x, i) => (
            <div
              key={x.id}
              className={cn(styles.item, {
                [styles.selected]: this._selector.isSelected(i),
              })}
              onClick={(ev) => this._selector.select(i, ev)}
            >
              <img src={x.assets.hugeThumb.url} title={x.description} />
            </div>
          ))}
      </div>
    );
  }
}
