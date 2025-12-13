import React, { useMemo } from 'react';
import { SmartTextUploader } from '../texts/SmartTextUploader';
import { SmartImageUploader } from '../images/SmartImageUploader';
import { getRouteFromPageKey } from '../nav/navUtils';
import { useAdminStatic } from '../publish/useAdminStatic';
import { useAdminData } from '../publish/useAdminData';
import { DynamicDataType, EditableGroup } from '../publish/publish.type';
import { CollapsibleSection } from '../nav/CollapsibleSection';
import { textRules } from '../../data/textRules';
import { imageRules } from '../../data/imageRules';
import { BlocGroupManager } from '../blocs/BlocGroupManager';
import { BlocPicker } from './BlocPicker';
import { SmartVideoUploader } from '../videos/SmartVideoUploader';
import { videoRules } from '../../data/videoRules';

interface AdminPageProps {
  pageKey: string;
  pageTitle: string;
}

export const AdminPage: React.FC<AdminPageProps> = React.memo(
  ({ pageKey, pageTitle }) => {
    const { isLoaded } = useAdminStatic();
    const { getPageSnapshot } = useAdminData().snapshots;

    const routePath = useMemo(() => getRouteFromPageKey(pageKey), [pageKey]);
    const groups: EditableGroup[] = !isLoaded ? [] : getPageSnapshot(routePath);
    console.log(`Groups for page ${routePath}`, groups);
    

    const renderedContent = useMemo(() => {
      if (
        groups.every((group) => {
          if (group.kind === 'fields')
            return Object.keys(group.fields).length === 0;
          if (group.kind === 'blocPickers') return group.fields.length === 0;
          return true;
        })
      ) {
        return (
          <div className="admin-field-group">
            <h3 className="no-data">
              Vous n'avez aucune donnée à modifier ici.
            </h3>
          </div>
        );
      }

      return groups.map((group) => {
        if (group.kind === 'fields') {
          const { label, blocKey, fields } = group;

          if (blocKey !== undefined) {
            return (
              <BlocGroupManager
                key={`bloc-group-${blocKey}`}
                blocKey={blocKey}
                blocLabel={label}
              />
            );
          }

          const textKeys = Object.keys(fields).filter(
            (k) => fields[k].dataType === DynamicDataType.Text,
          );
          const imageKeys = Object.keys(fields).filter(
            (k) => fields[k].dataType === DynamicDataType.Image,
          );
          const videoKeys = Object.keys(fields).filter(
            (k) => fields[k].dataType === DynamicDataType.Video,
          );

          return (
            <CollapsibleSection
              title={label}
              className="admin-field-group"
              headerClassName="field-title"
              key={`section-${label}`}
            >
              {textKeys.map((textKey) => (
                <SmartTextUploader
                  key={textKey}
                  textKey={textKey}
                  textRules={textRules[textKey]}
                />
              ))}
              {imageKeys.map((imageKey) => (
                <SmartImageUploader
                  key={imageKey}
                  imageKey={imageKey}
                  imageRule={imageRules[imageKey]}
                />
              ))}
              {videoKeys.map((videoKey) => (
                <SmartVideoUploader
                  key={videoKey}
                  videoKey={videoKey}
                  videoRule={videoRules[videoKey]}
                />
              ))}
            </CollapsibleSection>
          );
        }

        if (group.kind === 'blocPickers') {
          return (
            <CollapsibleSection
              title={group.label}
              className="admin-field-group"
              headerClassName="field-title"
              key={`section-${group.label}`}
            >
              {group.fields.map((picker) => (
                <BlocPicker
                  key={picker.pickerKey}
                  pickerKey={picker.pickerKey}
                  pickerRule={picker.rule}
                />
              ))}
            </CollapsibleSection>
          );
        }

        return null;
      });
    }, [groups]);

    if (!isLoaded) {
      return (
        <div className="admin-loading">
          <p>Chargement...</p>
        </div>
      );
    }

    return (
      <div id="tp" className="admin-page">
        <div className="admin-page-header">
          <h2 className="admin-page-title">{pageTitle}</h2>
        </div>
        <div className="page-content">{renderedContent}</div>
      </div>
    );
  },
);
