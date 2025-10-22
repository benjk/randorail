import React from 'react';
import { SmartTextUploader } from '../texts/SmartTextUploader';
import { SmartImageUploader } from '../images/SmartImageUploader';
import { useAdminStatic } from '../publish/useAdminStatic';
import { useAdminData } from '../publish/useAdminData';
import { DynamicDataType } from '../publish/publish.type';
import { CollapsibleSection } from '../nav/CollapsibleSection';
import { imageRules } from '../../data/imageRules';
import { textRules } from '../../data/textRules';

export const AdminContact = React.memo(() => {
  const { isLoaded } = useAdminStatic();
  const groups = useAdminData().snapshots.getContactSnapshot();

  if (!isLoaded) {
    return (
      <div className="admin-loading">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div id="contact" className="admin-page admin-contact">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Contact</h2>
      </div>
      <div className="page-content">
        {groups.map(({ label, fields }) => {
          const textKeys = Object.keys(fields).filter(
            (k) => fields[k].dataType === DynamicDataType.Text,
          );
          const imageKeys = Object.keys(fields).filter(
            (k) => fields[k].dataType === DynamicDataType.Image,
          );

          return (
            <CollapsibleSection
              title={label}
              className="admin-field-group"
              headerClassName="field-title"
              key={label}
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
            </CollapsibleSection>
          );
        })}
      </div>
    </div>
  );
});
