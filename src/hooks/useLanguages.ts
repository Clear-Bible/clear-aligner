import { useEffect, useState } from 'react';
import { LanguageInfo } from '../structs';
import { useDatabase } from './useDatabase';
import { DefaultProjectName } from '../state/links/tableManager';

/**
 * get map of all languages in db
 */
export const useLanguages = (): Map<string, LanguageInfo>|undefined => {
  const db = useDatabase();
  const [ languagesMap, setLanguagesMap ] = useState<Map<string, LanguageInfo>|undefined>();

  useEffect(() => {
    const load = () => {
      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          const languages = await db.languageGetAll(DefaultProjectName);
          const langMap = new Map<string, LanguageInfo>();
          languages.forEach((l) => langMap.set(l.code, l));
          setLanguagesMap(langMap);
        })
      });
    }

    void load();
  }, [setLanguagesMap, db]);

  return languagesMap;
}