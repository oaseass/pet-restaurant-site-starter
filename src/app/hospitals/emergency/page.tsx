import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";

export const dynamic = "force-dynamic";

export default function EmergencyHospitalsPage() {
  return <PlaceDirectoryPage categorySlug="emergency-hospital" title="24시 응급 병원" description="야간·응급 대응 정보는 공식 원천, 관리자 검수, 제보를 구분해서 노출합니다." />;
}