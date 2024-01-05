import xmlToJson from 'workbench/xmlToJson';
import cachedSyntaxData from 'workbench/cachedSyntaxData';
import { SyntaxRoot } from 'structs';
import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';

const MACULA_ENV = 'http://labs.clear.bible/symphony-dev';

const jsonizeXml = async (xmlString: string): Promise<object | null> => {
  try {
    return await xmlToJson(
      xmlString,
      [
        'class',
        'role',
        'head',
        'discontinuous',
        'lemma',
        'person',
        'number',
        'gender',
        'case',
        'tense',
        'voice',
        'mood',
        'articular',
        'det',
        'type',
        'n',
        'gloss',
        'strong',
        'osisId',
      ],
      'sentence'
    );
  } catch (error) {
    console.error('Problem encountered converting xml to json.');
    console.error(error);
    return null;
  }
};
const fetchSyntaxData = async (
  position?: BCVWP | null
): Promise<SyntaxRoot | null> => {
  if (position && position.hasFields(BCVWPField.Book)) {
    const bookDoc = position.getBookInfo()!;
    const osisRef = `${bookDoc.OSIS}.${position?.chapter}.${position?.verse}`;

    if (Object.keys(cachedSyntaxData).includes(osisRef)) {
      const cachedSyntaxDatum = cachedSyntaxData[osisRef];
      const jsonizedXml = await jsonizeXml(cachedSyntaxDatum);
      return jsonizedXml as unknown as SyntaxRoot;
    }

    const response = await fetch(
      `${MACULA_ENV}/api/GNT/Nestle1904/lowfat?osis-ref=${osisRef}`
    );
    const xmlDoc = await response.text();
    try {
      const jsonizedXml = await xmlToJson(
        xmlDoc,
        [
          'rule',
          'class',
          'role',
          'head',
          'discontinuous',
          'lemma',
          'person',
          'number',
          'gender',
          'case',
          'tense',
          'voice',
          'mood',
          'articular',
          'det',
          'type',
          'n',
          'gloss',
          'strong',
          'osisId',
        ],
        'sentence'
      );
      return jsonizedXml as SyntaxRoot;
    } catch (error) {
      console.error('There was an error when fetching data from macula.');
      console.error(xmlDoc);
      console.error(error);
    }
  }

  return null;
};
export default fetchSyntaxData;
