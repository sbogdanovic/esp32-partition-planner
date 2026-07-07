import PlannerForm from "@/modules/planner/components/PlannerForm";
import GeneratedOutput from "@/modules/planner/components/GeneratedOutput";
import usePlanner from "@/modules/planner/hooks/usePlanner";

export default function PlannerPage(): JSX.Element {
  const planner = usePlanner();

  return (
    <>
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <main className="layout">
        <PlannerForm planner={planner} />
        <GeneratedOutput planner={planner} />
      </main>
    </>
  );
}
