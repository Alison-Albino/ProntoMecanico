import { ServiceRequestForm, ServiceRequestData } from "../ServiceRequestForm";

export default function ServiceRequestFormExample() {
  const handleSubmit = (requestData: ServiceRequestData) => {
    console.log("Service request submitted:", requestData);
    // TODO: remove mock functionality
    alert(`Serviço solicitado: ${requestData.serviceType}\nLocal: ${requestData.fromAddress}\nDescrição: ${requestData.description}`);
  };

  const handleCancel = () => {
    console.log("Service request cancelled");
  };

  return (
    <div className="p-6 flex justify-center">
      <ServiceRequestForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}