import React from "react";

type InputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

type OwnProps = {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
};

type Props = OwnProps & Omit<InputProps, "onChange">;

export default class Editable extends React.PureComponent<Props> {
  state = {
    editMode: false,
    value: this.props.value,
  };

  componentDidUpdate(prevProps) {
    const { value, disabled } = this.props;

    if (value !== prevProps.value) this.setState({ value });
    if (this.state.editMode && disabled) this.hideEditor();
  }

  render() {
    const { editMode } = this.state;

    return (
      <div onClick={this.openEditor}>
        {editMode ? this.drawEditor() : this.props.children}
      </div>
    );
  }

  drawEditor() {
    const { children, ...rest } = this.props;

    return (
      <input
        {...rest}
        value={this.state.value}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        onBlur={this.hideEditor}
        autoFocus
      />
    );
  }

  openEditor = () => {
    if (!this.props.disabled) {
      this.setState({ editMode: true });
    }
  };

  hideEditor = () => {
    this.setState({ editMode: false });
  };

  handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ value: ev.target.value });
  };

  handleKeyPress = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter") {
      this.props.onChange(this.state.value);
      this.hideEditor();
    }
  };
}
