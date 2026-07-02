import { useEffect, useState } from "react";
import { pipelineApi, dealsApi } from "../../api/pipelineApi";
import { useToast } from "../../context/ToastContext";
import { PageHeader } from "../../components/common/PageHeader";
import { PageLoading, EmptyState } from "../../components/ui/Misc";
import { Button } from "../../components/ui/Button";
import { IconPipeline } from "../../components/ui/Icons";
import { KanbanBoard } from "../../components/pipeline/KanbanBoard";
import { DealFormModal } from "../../components/deals/DealFormModal";
import { getErrorMessage } from "../../utils/errorUtils";

export default function PipelinePage() {
  const toast = useToast();
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStageId, setDefaultStageId] = useState(null);

  function loadBoard() {
    setLoading(true);
    pipelineApi
      .board()
      .then((res) => setColumns(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMoveDeal(dealId, stageId) {
    try {
      await dealsApi.move(dealId, stageId);
      loadBoard();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function handleAddDeal(stageId) {
    setDefaultStageId(stageId);
    setModalOpen(true);
  }

  async function handleCreateDeal(payload) {
    await dealsApi.create(payload);
  }

  function handleSaved() {
    toast.success("Deal created.");
    setModalOpen(false);
    loadBoard();
  }

  if (loading) return <PageLoading />;

  const stages = columns.map((c) => c.stage);
  const totalPipelineValue = columns.reduce((sum, c) => sum + c.total_value, 0);

  return (
    <div className="page-container">
      <PageHeader
        title="Sales Pipeline"
        subtitle={`${columns.reduce((s, c) => s + c.deal_count, 0)} open deals across ${stages.length} stages`}
        actions={
          <Button onClick={() => handleAddDeal(stages[0]?.id)}>
            New deal
          </Button>
        }
      />

      {stages.length === 0 ? (
        <div className="card card-pad">
          <EmptyState
            icon={<IconPipeline width={32} height={32} />}
            title="No pipeline stages configured"
            message="Ask an administrator to set up pipeline stages in Settings."
          />
        </div>
      ) : (
        <KanbanBoard
          columns={columns}
          onMoveDeal={handleMoveDeal}
          onAddDeal={handleAddDeal}
        />
      )}

      <DealFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        saveFn={handleCreateDeal}
        stages={stages}
        defaultStageId={defaultStageId}
      />
    </div>
  );
}