import React from "react";
import cn from "classnames";
import { Formik, Field } from "formik";
import { Settings } from "app/types";
import { Input, Title, Toolbar } from "components/misc";
import styles from "./styles.scss";

const Entry = ({ name, label, as = Input }) => (
  <Field>
    {({ form }) => (
      <label className={styles.label}>
        {label}
        <Field
          as={as}
          name={name}
          className={styles.input}
          onChange={form.handleChange}
          onBlur={(ev) => {
            form.handleBlur(ev);
            form.submitForm();
          }}
        />
      </label>
    )}
  </Field>
);

type Props = {
  settings: Settings;
  close();
};

export default function Settings({ settings, close }: Props) {
  return (
    <Formik initialValues={settings()} onSubmit={(v) => settings.set(v)}>
      <div className={styles.overlay}>
        <div className={styles.window}>
          <Toolbar className={cn(styles.header)} border="bottom">
            <Title>Settings</Title>
            <a
              href="#"
              className={cn(styles.closeButton, "icon icon-cancel-squared")}
              onClick={close}
            />
          </Toolbar>

          <main className={styles.content}>
            <div className={styles.warning}>
              <h3 className={styles.text}>
                Warning: all settings are stored in plain text.
              </h3>
            </div>

            <div>
              <fieldset>
                <legend>Imagga</legend>
                <Entry name="imagga" label="API-key" />
              </fieldset>
            </div>

            <div>
              <fieldset>
                <legend>Shutterstock</legend>
                <Entry name="shutterstock" label="API-key" />
              </fieldset>
            </div>

            <div>
              <fieldset>
                <legend>Exiftool</legend>
                <Entry name="exiftool" label="Path" />
              </fieldset>
            </div>
          </main>

          <Toolbar border="top">&nbsp;</Toolbar>
        </div>
      </div>
    </Formik>
  );
}
