import { motion } from 'framer-motion';
import { Settings, User, Bell, Building2 } from 'lucide-react';
import "../styles/settings.css";
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const sections = [
    {
      icon: User,
      title: 'Profile Settings',
      desc: 'Update your personal information and preferences',
      fields: [
        {
          label: 'Full Name',
          value: user?.name || '',
          type: 'text',
        },
        {
          label: 'Email Address',
          value: user?.email || '',
          type: 'email',
        },
      ],
    },
    {
      icon: Building2,
      title: 'Organization',
      desc: 'Manage your company settings and team access',
      fields: [
        {
          label: 'Company Name',
          value: 'ResumeIQ',
          type: 'text',
        },
        {
          label: 'Industry',
          value: 'HR Technology',
          type: 'text',
        },
      ],
    },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="settings-page"
    >
      <div className="settings-header">
        <div className="dashboard-header-icon">
          <Settings />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 m-0">Account Settings</h2>
          <p className="text-gray-500 text-sm m-0">Manage profile information, organization settings and notifications.</p>
        </div>
      </div>

      <div className="space-y-5">
        {sections.map(({ icon: Icon, title, desc, fields }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="settings-card"
          >
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-sage-50 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-sage-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm m-0">{title}</h3>
                <p className="text-xs text-gray-400 m-0">{desc}</p>
              </div>
            </div>
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.label}>
                  <label className="label">{f.label}</label>
                  <input type={f.type} value={f.value} readOnly className="input-field" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button className="btn-primary">Save Changes</button>
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="settings-card"
        >
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-sage-50 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-sage-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm m-0">Notifications</h3>
              <p className="text-xs text-gray-400 m-0">Control what alerts you receive</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'New candidate matches', sub: 'Get notified when a candidate scores above your threshold' },
              { label: 'Batch screening completed', sub: 'Alert when bulk upload analysis finishes' },
              { label: 'Weekly analytics digest', sub: 'Summary of your hiring pipeline performance' },
            ].map(({ label, sub }, i) => (
              <div key={label} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-gray-800 m-0">{label}</p>
                  <p className="text-xs text-gray-400 m-0">{sub}</p>
                </div>
                <div className={`toggle ${i !== 1 ? 'on' : 'off'}`}>
                  <div className="toggle-inner" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
