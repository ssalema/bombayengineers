import { useSearchParams } from 'react-router';
import { Box, Card, Tab, Tabs } from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { PageHeader } from '../../components/common/PageHeader';
import { SettingsFormSkeleton } from '../../components/common/Skeletons';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { GeneralSettingsForm } from './GeneralSettingsForm';
import { ProfileSettings } from './ProfileSettings';

const TABS = [
  { value: 'general', label: 'General', icon: StorefrontOutlinedIcon },
  { value: 'profile', label: 'Profile and security', icon: ManageAccountsOutlinedIcon },
];

const tabId = (value) => `settings-tab-${value}`;
const panelId = (value) => `settings-panel-${value}`;

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === searchParams.get('tab')) ? searchParams.get('tab') : 'general';
  const { settings, isLoading } = useSiteSettings();

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage business details, branding and your account." />

      <Card sx={{ mb: 2.5, px: { xs: 0.5, sm: 1 } }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setSearchParams({ tab: value }, { replace: true })}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Settings sections"
        >
          {TABS.map(({ value, label, icon: Icon }) => (
            <Tab
              key={value}
              value={value}
              label={label}
              id={tabId(value)}
              aria-controls={panelId(value)}
              icon={<Icon fontSize="small" />}
              iconPosition="start"
              sx={{ minHeight: 56 }}
            />
          ))}
        </Tabs>
      </Card>

      <Box role="tabpanel" id={panelId(tab)} aria-labelledby={tabId(tab)}>
        {tab === 'general' && (isLoading ? <SettingsFormSkeleton /> : <GeneralSettingsForm settings={settings} />)}
        {tab === 'profile' && <ProfileSettings />}
      </Box>
    </>
  );
}
