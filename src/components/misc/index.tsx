import React from "react";
import cn from "classnames";
import styles from "./styles.scss";

const withClassName = (c, Comp = "div" as any) =>
  React.forwardRef(({ className, children, ...rest }: any, ref) => (
    <Comp className={cn(c, className)} {...rest} ref={ref}>
      {children}
    </Comp>
  ));

export const Window = withClassName(styles.window);

export const Loading = () => (
  <div className={styles.loading}>
    <Spinner />
  </div>
);

export const Spinner = () => (
  <div>
    <div className="fa fa-spinner fa-spin fa-fw" />
  </div>
);

export const Title = withClassName("title", "h2");

export const Toolbar = ({ className, border, children }: any) => (
  <div
    className={cn(className, "toolbar", {
      "toolbar-header": border === "bottom" || border === "both",
      "toolbar-footer": border === "top" || border === "both",
    })}
  >
    <div className="toolbar-actions">{children}</div>
  </div>
);

export const Icon = ({ icon }) => {
  const fa = / (fas|fab)$/.test(icon);
  return <span className={fa ? `fa-${icon}` : `icon icon-${icon}`} />;
};

export const Input = withClassName(styles.input, "input");
export const Textarea = withClassName(styles.textarea, "textarea");
export const Select = withClassName(styles.select, "select");

export const Button = ({ className, icon, caption, active, ...rest }: any) => (
  <button className={cn("btn btn-default", className, { active })} {...rest}>
    {icon && <Icon icon={icon} />}
    {caption && (
      <span style={icon && caption && { marginLeft: "0.5em" }}>{caption}</span>
    )}
  </button>
);

export const ButtonGroup = withClassName("btn-group");
