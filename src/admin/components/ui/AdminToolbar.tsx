import React, { useEffect, useRef } from 'react';
import { generateContentForPublish, publish } from '../publish/PublishService';
import { auth } from '../auth/firebaseClient';
import { getIdToken } from 'firebase/auth';
import { Eye, RotateCcw, Undo2 } from 'lucide-react';
import { useConfirm } from '../modal/ConfirmModalContext';
import { useAdminData } from '../publish/useAdminData';
import { useAdminStatus } from '../publish/useAdminStatus';
import {
  DeploymentState,
  PublishError,
  ServerMessageType,
} from '../publish/publish.type';
import { useDeploymentStatus } from '../publish/useDeploymentData';
import { serverMessages } from '../publish/messages';
import { getBlocIndice } from '../blocs/blocHelper';

export const AdminToolbar = React.memo(function AdminToolbar(props) {
  const adminData = useAdminData();

  const {
    isPublishing,
    serverMessage,
    setIsPublishing,
    setServerMessage,
    pushServerMessage,
  } = useAdminStatus();

  const deployment = useDeploymentStatus();

  const lastDeploymentStatus = useRef<DeploymentState>(deployment.status);

  useEffect(() => {
    const prev = lastDeploymentStatus.current;
    const curr = deployment.status;
    lastDeploymentStatus.current = curr;

    const isExternal = !deployment.isOwnDeployment;

    if (isExternal && prev === DeploymentState.Pending) {
      if (curr === DeploymentState.Deployed) {
        setServerMessage({
          type: ServerMessageType.Error,
          text: serverMessages.newPublishVersion,
        });
      } else if (curr === DeploymentState.Error) {
        setServerMessage({
          type: ServerMessageType.Error,
          text: deployment.error || serverMessages.lastPublishError,
        });
      }
    }
  }, [deployment.status]);

  const {
    modifiedTextFields,
    modifiedImageFields,
    modifiedBlocs,
    modifiedBlocPickers,
  } = adminData.uiHooks.useModifiedFields();

  console.log('ADMIN TOOLBAR MODIFIED KEYS :');
  console.log(modifiedTextFields, modifiedImageFields, modifiedBlocs, modifiedBlocPickers);

  const confirm = useConfirm();
  const hasChanges =
    modifiedTextFields.length > 0 ||
    modifiedImageFields.length > 0 ||
    modifiedBlocPickers.length > 0 ||
    modifiedBlocs.length > 0;

  const handlePublish = async () => {
    const user = auth.currentUser;
    if (!user) return alert('Non autorisé');

    if (deployment.isExternalPending) {
      const now = Date.now();
      const someMinutes = 4 * 60 * 1000;

      const isStuck =
        deployment.startedAt && now - deployment.startedAt > someMinutes;

      if (!isStuck) {
        setServerMessage({
          type: ServerMessageType.Error,
          text: serverMessages.alreadyPublishing,
        });
        return;
      }

      console.warn('⚠️ Déploiement bloqué détecté, on force la main');
    }

    setIsPublishing(true);
    setServerMessage(null);
    pushServerMessage(serverMessages.validationStart);

    try {
      const jwt = await getIdToken(user);

      const generatedContent = await generateContentForPublish(
        [...modifiedTextFields, ...modifiedImageFields],
        modifiedBlocs,
        modifiedBlocPickers,
        adminData.raw.jsonContent,
        deployment.contentVersion,
      );

      console.log('generatedContent');
      console.log(generatedContent);

      const result = await publish(generatedContent, jwt, pushServerMessage);
      const newVersion = result.contentVersion;
      if (newVersion) {
        deployment.updateContentVersion(newVersion);
        adminData.raw.updateJsonContent(
          JSON.stringify(generatedContent.jsonContent),
        );
      }
    } catch (err) {
      console.error('Erreur lors de la publication :', err);

      if (err instanceof PublishError && err.status === 429) {
        setServerMessage({
          type: ServerMessageType.Error,
          text: err.message || serverMessages.publishThrottled,
        });
      } else if (err instanceof PublishError && err.status === 409) {
        setServerMessage({
          type: ServerMessageType.Error,
          text: err.message || serverMessages.osboleteDatas,
        });
      } else {
        setServerMessage({
          type: ServerMessageType.Error,
          text: serverMessages.publishError,
        });
      }
      setIsPublishing(false);
    }
  };

  const handleRollback = () => {
    confirm(serverMessages.rollbackConfirm, () => {
      adminData.rollback.rollbackToInitial();
    });
  };

  return (
    <div className={`admin-toolbar ${!hasChanges ? 'disabled' : ''}`}>
      <div className="toolbar-wrapper">
        {hasChanges && (
          <div className="info-container">
            {modifiedTextFields.length > 0 && (
              <div className="info-col">
                <h4>Textes modifiés</h4>
                <ul>
                  {modifiedTextFields.map((fieldVM) => (
                    <li key={fieldVM.key}>📝 {fieldVM.label || fieldVM.key}</li>
                  ))}
                </ul>
              </div>
            )}
            {modifiedImageFields.length > 0 && (
              <div className="info-col">
                <h4>Images modifiées</h4>
                <ul>
                  {modifiedImageFields.map(
                    (fieldVM) =>
                      !fieldVM.key.startsWith('icon_') && (
                        <li key={fieldVM.key}>
                          🖼️ {fieldVM.label || fieldVM.key}
                        </li>
                      ),
                  )}
                </ul>
              </div>
            )}
            {modifiedBlocs.length > 0 && (
              <div className="info-col">
                <h4>Blocs modifiés</h4>
                <ul>
                  {modifiedBlocs
                    .slice()
                    .sort((a, b) => {
                      if (a.blocKey < b.blocKey) return -1;
                      if (a.blocKey > b.blocKey) return 1;
                      return a.index - b.index;
                    })
                    .map((bloc) => {
                      const blocIndice = getBlocIndice(bloc.index, bloc.order);
                      return (
                        <li
                          key={`${bloc.blocKey}.${bloc.index}.${bloc.isNew ? 'new' : bloc.isDeleted ? 'deleted' : 'modified'}`}
                        >
                          🧱 {bloc.blocTitle} {blocIndice}
                          {bloc.isNew && <strong> ajouté</strong>}
                          {bloc.isDeleted && <strong> supprimé</strong>}
                          {bloc.isReordered && <strong> déplacé ⇅</strong>}
                          {!bloc.isNew &&
                            !bloc.isDeleted &&
                            bloc.modifiedFields &&
                            Object.keys(bloc.modifiedFields).length > 0 && (
                              <ul>
                                {Object.entries(bloc.modifiedFields).map(
                                  ([fieldKey, field]) => {
                                    let icon =
                                      field.dataType === 'text' ? '📝' : '🖼️';
                                    return (
                                      <li
                                        className="item-bloc-info"
                                        key={fieldKey}
                                      >
                                        {icon}
                                        {field.isNew && <strong> + </strong>}
                                        {field.isDeleted && (
                                          <strong> - </strong>
                                        )}
                                        {field.reordered && (
                                          <strong> ⇅ </strong>
                                        )}
                                        {field.label}{' '}
                                        {field.fieldIndex !== undefined
                                          ? field.fieldIndex + 1
                                          : field.order !== undefined
                                            ? field.order + 1
                                            : null}
                                      </li>
                                    );
                                  },
                                )}
                              </ul>
                            )}
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
            {modifiedBlocPickers.length > 0 && (
              <div className="info-col">
                <ul>
                  {modifiedBlocPickers.map((picker) => (
                    <li key={picker.pickerKey}>
                      🎯 <strong>Modification :</strong> {picker.rule.title || picker.pickerKey}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="admin-actions">
          <div className="btn-container">
            <button
              className="admin-btn"
              onClick={handleRollback}
              disabled={isPublishing || !hasChanges}
            >
              <Undo2 className="admin-icon" size="14" />
            </button>
            <button
              onClick={handlePublish}
              className={`admin-btn primary ${isPublishing ? 'loading' : ''} ${
                !hasChanges ? 'disabled' : ''
              }`}
              disabled={isPublishing || !hasChanges}
            >
              <span className="btn-text">Publier</span>
              <span className="loader" />
            </button>
          </div>
          {serverMessage?.text && (
            <div className="msg-container">
              <p className={`info-msg ${serverMessage.type} msg-title`}>
                {serverMessage.text}
              </p>
              {serverMessage.type === ServerMessageType.Success && (
                <a href="/" target="_blank">
                  <button className="admin-btn">
                    <Eye></Eye>
                  </button>
                </a>
              )}
              {(serverMessage.text === serverMessages.newPublishVersion ||
                serverMessage.text === serverMessages.osboleteDatas) && (
                <a href="/admin">
                  <button className="admin-btn">
                    <RotateCcw></RotateCcw>
                  </button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
