import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { Button } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { PageHeader } from '../../components/common/PageHeader';
import { ChallanList } from '../../components/challan/ChallanList';
import { ChallanSavedDialog } from '../../components/challan/ChallanSavedDialog';
import { ROUTES } from '../../config/constants';

export default function ChallansPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // Set by the create page right after a successful save.
  const savedChallan = location.state?.savedChallan ?? null;

  // Clear the history state so a reload or back/forward doesn't reopen the dialog.
  const closeSavedDialog = () => navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });

  return (
    <>
      <PageHeader
        title="Challans"
        subtitle="Search, filter, print and download all delivery challans."
        actions={
          <Button component={RouterLink} to={ROUTES.CHALLAN_CREATE} variant="contained" startIcon={<AddRoundedIcon />}>
            Create challan
          </Button>
        }
      />
      <ChallanList />
      <ChallanSavedDialog challan={savedChallan} onClose={closeSavedDialog} />
    </>
  );
}
