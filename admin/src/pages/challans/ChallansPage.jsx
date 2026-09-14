import { Link as RouterLink } from 'react-router';
import { Button } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { PageHeader } from '../../components/common/PageHeader';
import { ChallanList } from '../../components/challan/ChallanList';
import { ROUTES } from '../../config/constants';

export default function ChallansPage() {
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
    </>
  );
}
