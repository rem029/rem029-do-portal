import { Fragment } from "react";
import escapeHTML from "escape-html";
import { Text, Node, BaseText, BaseEditor } from "slate";
import { decodeHTML4 } from "entities";

const getAlignmentClass = (node: any) => {
  switch (node?.textAlign) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    case "left":
    default:
      return "text-left";
  }
};

export const serializeSlate = (children: any, depth = 0): string[] | JSX.Element[] =>
  children?.map((node: Node, i: number) => {
    if (Text.isText(node)) {
      let text: JSX.Element | string = decodeHTML4(escapeHTML(node.text));

      if ((node as BaseText).bold) {
        text = <strong key={`serializer_key_${i}`}>{text}</strong>;
      }

      if (node.code) {
        text = <code key={`serializer_key_${i}`}>{text}</code>;
      }

      if (node.italic) {
        text = <em key={`serializer_key_${i}`}>{text}</em>;
      }

      if (node.text === "") {
        text = <div className="block h-3" />;
      }

      return <Fragment key={`serializer_key_${i}`}>{text}</Fragment>;
    }

    const textAlignment = getAlignmentClass(node);
    const indentStyle = `ml-${depth * 4}`;

    if (!node) {
      return null;
    }

    switch ((node as BaseEditor).type) {
      case "h1":
        return (
          <h1
            key={`serializer_key_${i}`}
            className={`!text-5xl max-md:!text-4xl ${textAlignment} `}
          >
            {serializeSlate(node.children, depth + 1)}
          </h1>
        );
      case "h2":
        return (
          <h2
            key={`serializer_key_${i}`}
            className={`!text-4xl max-md:!text-3xl ${textAlignment} `}
          >
            {serializeSlate(node.children, depth + 1)}
          </h2>
        );
      case "h3":
        return (
          <h3
            key={`serializer_key_${i}`}
            className={`!text-3xl max-md:!text-2xl ${textAlignment} `}
          >
            {serializeSlate(node.children, depth + 1)}
          </h3>
        );
      case "h4":
        return (
          <h4
            key={`serializer_key_${i}`}
            className={`!text-2xl max-md:!text-xl ${textAlignment} `}
          >
            {serializeSlate(node.children, depth + 1)}
          </h4>
        );
      case "h5":
        return (
          <h5
            key={`serializer_key_${i}`}
            className={`!text-xl max-md:!text-lg ${textAlignment} `}
          >
            {serializeSlate(node.children, depth + 1)}
          </h5>
        );
      case "h6":
        return (
          <h6
            key={`serializer_key_${i}`}
            className={`!text-lg max-md:!text-md ${textAlignment} `}
          >
            {serializeSlate(node.children, depth + 1)}
          </h6>
        );
      case "blockquote":
        return (
          <blockquote
            className={`max-md:text-sm italic `}
            key={`serializer_key_${i}`}
          >
            {serializeSlate(node.children, depth + 1)}
          </blockquote>
        );
      case "ul":
        return (
          <ul
            className={`list-disc ${textAlignment} ${indentStyle} [&_ul]:list-[revert]`}
            key={`serializer_key_${i}`}
          >
            {serializeSlate(node.children, depth + 1)}
          </ul>
        );
      case "ol":
        return (
          <ol
            className={`list-decimal ${textAlignment} ${indentStyle}`}
            key={`serializer_key_${i}`}
          >
            {serializeSlate(node.children, depth + 1)}
          </ol>
        );
      case "li":
        return (
          <li
            className={`list-item list-inside ${textAlignment} ${indentStyle}`}
            key={`serializer_key_${i}`}
          >
            {serializeSlate(node.children, depth)}
          </li>
        );
      case "indent":
        return (
          <span className={`pl-2 block w-full`} key={`serializer_key_${i}`}>
            {serializeSlate(node.children, depth + 1)}
          </span>
        );
      case "link":
        return (node as BaseEditor)?.newTab ? (
          <a
            className={`link-primary font-bold underline ${textAlignment} `}
            href={escapeHTML(node.url)}
            key={`serializer_key_${i}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {serializeSlate(node.children, depth)}
          </a>
        ) : (
          <a
            className={`link-primary font-bold underline ${textAlignment} `}
            href={escapeHTML(node.url)}
            key={`serializer_key_${i}`}
          >
            {serializeSlate(node.children, depth)}
          </a>
        );

      default:
        return (
          <span key={`serializer_key_${i}`}>
            {serializeSlate(node.children, depth)}
          </span>
        );
    }
  });
