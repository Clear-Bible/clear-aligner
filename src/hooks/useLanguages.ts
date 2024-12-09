/**
 * This file contains the useLanguages hook, which returns a map of all
 * languages in the database.
 */
import { useContext, useEffect, useState } from 'react';
import { LanguageInfo } from '../structs';
import { useDatabase } from './useDatabase';
import { AppContext } from '../App';

/**
 * get map of all languages in db
 */
export const useLanguages = (): Map<string, LanguageInfo>|undefined => {
  const db = useDatabase();
  const {preferences} = useContext(AppContext);
  const [ languagesMap, setLanguagesMap ] = useState<Map<string, LanguageInfo>|undefined>();

  useEffect(() => {
    const load = () => {
      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          const languages = !!preferences?.currentProject ? (await db.languageGetAll(preferences?.currentProject)) : [];
          const langMap = new Map<string, LanguageInfo>();
          languages.forEach((l) => langMap.set(l.code, l));
          setLanguagesMap(langMap);
        })
      });
    }

    void load();
  }, [setLanguagesMap, db, preferences?.currentProject]);

  return languagesMap;
}
