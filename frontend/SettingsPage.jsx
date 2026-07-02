import { useEffect, useState } from "react";
import { settingsApi } from "../../api/miscApi";
import { pipelineApi } from "../../api/pipelineApi";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/PageHeader";
import { PageLoading } from "../../components/ui/Misc";
import { Button } from "../../components/ui/Button";
import { FieldGroup, TextInput } from "../../components/ui/FormFields";
import { IconPlus, IconTrash } from "../../components/ui/Icons";
import { getErrorMessage } from "../../utils/errorUtils";

export default function SettingsPage() {
  const toast = useToast();
  const [companyName, setCompanyName] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  const [stages, setStages] = useState([]);
  const [newStageName, setNewStageName] = useState("");
  const [addingStage, setAddingStage] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([
      settingsApi.list({ scope: "global" }).catch(() => ({ data: { data: [] } })),
      pipelineApi.listStages(),
    ])
      .then(([settingsRes, stagesRes]) => {
        const companySetting = settingsRes.data.data.find((s) => s.key === "company_name");
        setCompanyName(companySetting?.value || "");
        setStages(stagesRes.data.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSaveCompanyName(e) {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await settingsApi.upsert({ key: "company_name", value: companyName, scope: "global" });
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingCompany(false);
    }
  }

  async function handleAddStage(e) {
    e.preventDefault();
    if (!newStageName.trim()) return;
    setAddingStage(true);
    try {
      await pipelineApi.createStage({ name: newStageName, order: stages.length + 1 });
      setNewStageName("");
      load();
      toast.success("Pipeline stage added.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingStage(false);
    }
  }

  async function handleDeleteStage(stage) {
    try {
      await pipelineApi.removeStage(stage.id);
      load();
      toast.success("Pipeline stage removed.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="page-container">
      <PageHeader title="Settings" subtitle="Workspace configuration for administrators." />

      <div className="flex-col gap-4" style={{ maxWidth: 560 }}>
        <div className="card card-pad">
          <h3 style={{ marginBottom: 14 }}>Company</h3>
          <form onSubmit={handleSaveCompanyName}>
            <FieldGroup label="Company name">
              <TextInput value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" />
            </FieldGroup>
            <Button type="submit" loading={savingCompany}>Save</Button>
          </form>
        </div>

        <div className="card card-pad">
          <h3 style={{ marginBottom: 14 }}>Pipeline stages</h3>
          <div className="flex-col gap-2" style={{ marginBottom: 14 }}>
            {stages.map((stage) => (
              <div key={stage.id} className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border-hairline)" }}>
                <div className="flex items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color }} />
                  <span style={{ fontSize: 13.5 }}>{stage.name}</span>
                  <span className="text-muted text-sm">#{stage.order}</span>
                </div>
                <Button variant="ghost" size="sm" icon onClick={() => handleDeleteStage(stage)}>
                  <IconTrash width={14} height={14} />
                </Button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddStage} className="flex gap-2">
            <TextInput
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="New stage name"
              style={{ flex: 1 }}
            />
            <Button type="submit" loading={addingStage}>
              <IconPlus width={15} height={15} /> Add
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}