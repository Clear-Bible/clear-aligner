/**
 * This file exports the convert function used to convert xml to JSON.
 */
import parseXml from '@rgrove/parse-xml';

let attrsToKeep = [];

const attrMapper = (attrs) => {
  const keys = Object.keys(attrs).filter((key) => attrsToKeep.includes(key));

  const retainedAttrs = {};

  for (const key of keys) {
    retainedAttrs[key] = attrs[key];
  }
  return retainedAttrs;
};

const determineText = (rawNode) => {
  const text = rawNode.children.find(
    (child) => child.type === 'text' && Boolean(child.text.trim())
  );
  if (text) {
    return { text: text.text.trim() };
  }

  return {};
};
const grabContentNodes = (rawNode) => {
  const allKeys = Object.keys(rawNode);
  const filteredKeys = allKeys.filter((key) => {
    return !['type', 'name', 'attributes', 'isRootNode', 'children'].includes(
      key
    );
  });

  const processedNode = {
    elementType: rawNode['name'],
    ...attrMapper(rawNode['attributes']),
    ...determineText(rawNode),
  };

  for (const filteredKey of filteredKeys) {
    processedNode[filteredKey] = rawNode[filteredKey];
  }

  return processedNode;
};

const isValidElement = (xmlElement) => {
  if (xmlElement.type === 'text') {
    return false;
  }
  if (xmlElement.type === 'element' && xmlElement.name === 'p') {
    return false;
  }
  return true;
};

const determineChildren = (parsedXml) => {
  if (parsedXml.children) {
    const filteredChildren = parsedXml.children.filter((child) => {
      return isValidElement(child);
    });
    return filteredChildren.map((child) => {
      return mapper(child);
    });
  }
  return [];
};

const mapper = (parsedXml) => {
  const content = grabContentNodes(parsedXml);
  const children = determineChildren(parsedXml);
  return { content, children };
};

const convert = async (xmlData, requestedAttrs, rootNode) => {
  attrsToKeep = requestedAttrs;

  const parserResult = parseXml(xmlData);

  const parsedXml = parserResult.children
    .find((item) => item.name === rootNode)
    .toJSON();

  return mapper(parsedXml);
};

export default convert;
