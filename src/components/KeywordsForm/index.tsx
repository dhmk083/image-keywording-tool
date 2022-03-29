import React from "react";
import { render } from "react-dom";
import { Formik, Form, Field } from "formik";
import cn from "classnames";
import { observer } from "@dhmk/atom-react";
import { DomainError, handleGlobalError } from "@dhmk/utils";

import createSearch from "app/search";
import MultiEntryEditor from "components/MultiEditor";
import SearchResults from "components/SearchResults";
import Toaster from "components/Toaster";
import { Button, Input, Select, Window } from "components/misc";
import styles from "./styles.scss";
import "css/global.scss";

function sortDesc(kwsArray) {
  const counter = new Map();

  for (const kws of kwsArray) {
    for (const kw of kws) {
      counter.set(kw, (counter.get(kw) || 0) + 1);
    }
  }

  return [...counter].sort((a, b) => b[1] - a[1]).map((kv) => kv[0]);
}

const formInitialValues = {
  query: "",
  imageType: "",
  category: "",
  page: 1,
  perPage: 10,
};

const App = observer(
  class extends React.Component<any, any> {
    formik = React.createRef<any>();

    search = createSearch();

    state = {
      suggestedSelection: [],
      suggestedKeywords: [],
      selectedKeywords: [],
    };

    get formValues() {
      return this.formik.current?.values ?? formInitialValues;
    }

    get totalPages() {
      return Math.max(
        1,
        Math.ceil(this.search.totalItems() / this.formValues.perPage)
      );
    }

    componentDidMount() {
      this.componentWillUnmount = handleGlobalError((e) => {
        if (e instanceof DomainError) {
          const msg = (() => {
            switch (e.context) {
              case this.search:
                return `[search]: Cannot perform search request. Check Shutterstock API-key in settings. (${e.message})`;
              default:
                return "";
            }
          })();

          msg && this.props.showError(msg);
        }
      });
    }

    render() {
      const { page, perPage } = this.formValues;

      return (
        <Window>
          <Formik
            innerRef={this.formik}
            initialValues={formInitialValues}
            onSubmit={this.onSubmit}
          >
            <Form className={styles.searchForm}>
              <Field
                as={Input}
                name="query"
                placeholder="Query..."
                className={styles.item}
                style={{ width: "25%" }}
              />

              <label className={styles.item}>
                <span className={styles.label}>Image Type:</span>
                <Field as={Select} name="imageType">
                  <option value="">Any</option>
                  <option value="photo">Photo</option>
                  <option value="illustration">Illustration</option>
                  <option value="vector">Vector</option>
                </Field>
              </label>

              <label className={styles.item}>
                <span className={styles.label}>Category:</span>
                <Field as={Select} name="category">
                  <option value="">Any</option>
                  {this.search.categories().map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </Field>
              </label>

              <Button
                caption="Search"
                className={cn(styles.item, "btn-positive")}
                type="submit"
              />
            </Form>
          </Formik>

          <SearchResults
            busy={this.search.busy()}
            items={this.search.items()}
            totalItems={this.search.totalItems()}
            page={page}
            navigate={this.setPage}
            perPage={perPage}
            setPerPage={this.setPerPage}
            totalPages={this.totalPages}
            onSelect={this.addSuggested}
          />

          <div className={styles.keywordsMerging}>
            <div className={styles.content}>
              <div className={styles.editor}>
                <MultiEntryEditor
                  label="Suggested Keywords"
                  custom={this.suggestedCustom}
                  canEdit={false}
                  canAdd={false}
                  canDelete={false}
                  value={this.state.suggestedKeywords}
                  onChange={this.setSuggestedKeywords}
                  onSelect={this.handleSuggestedSelection}
                />
              </div>

              <div className={styles.separator} />

              <div className={styles.editor}>
                <MultiEntryEditor
                  label="Selected Keywords"
                  value={this.state.selectedKeywords}
                  onChange={this.setSelectedKeywords}
                />
              </div>
            </div>
          </div>
        </Window>
      );
    }

    onSubmit = (values) => {
      this.search.search(values);
    };

    setPage = (page) => {
      if (page <= 0 || page > this.totalPages) return;
      this.formik.current.setFieldValue("page", page);
      this.formik.current.submitForm();
    };

    setPerPage = (perPage) => {
      if (perPage <= 5 || perPage > 100) return;
      this.formik.current.setFieldValue("perPage", perPage);
      this.formik.current.submitForm();
    };

    addSuggested = (selection) => {
      const value = sortDesc([...selection].map((x) => x.keywords));
      this.setState({ suggestedKeywords: value });
    };

    pickSuggested = () =>
      this.state.suggestedSelection.length
        ? this.state.suggestedSelection
        : this.state.suggestedKeywords;

    setSuggestedKeywords = (x) => this.setState({ suggestedKeywords: x });

    setSelectedKeywords = (x) =>
      this.setState({ selectedKeywords: [...new Set(x)] });

    mergeSelectedWithSuggested = () => {
      this.setSelectedKeywords(
        this.state.selectedKeywords.concat(this.pickSuggested())
      );
    };

    replaceSelectedWithSuggested = () => {
      this.setSelectedKeywords(this.pickSuggested());
    };

    handleSuggestedSelection = (suggestedSelection) => {
      this.setState({ suggestedSelection });
    };

    suggestedCustom = (
      <>
        <Button
          onClick={this.mergeSelectedWithSuggested}
          title="Merge"
          icon="angle-double-right fas"
        />
        <Button
          onClick={this.replaceSelectedWithSuggested}
          title="Replace"
          icon="angle-right fas"
        />
      </>
    );
  }
);

render(
  <Toaster>
    <App />
  </Toaster>,
  document.getElementById("app")
);
