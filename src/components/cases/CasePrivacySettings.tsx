import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useSupabase } from '../../hooks/useSupabase';

interface PrivacySettings {
  privacy_level: number;
  allowed_roles: string[];
  allowed_specialties: string[];
}

interface CasePrivacySettingsProps {
  caseId: string;
  initialSettings: PrivacySettings;
  onUpdate: (settings: PrivacySettings) => void;
}

export const CasePrivacySettings: React.FC<CasePrivacySettingsProps> = ({
  caseId,
  initialSettings,
  onUpdate,
}) => {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [settings, setSettings] = React.useState<PrivacySettings>(initialSettings);
  const [isLoading, setIsLoading] = React.useState(false);

  const privacyLevels = [
    { level: 1, label: 'Public', description: 'Visible to all authenticated users' },
    { level: 2, label: 'Medical Professionals', description: 'Visible to doctors and educators' },
    { level: 3, label: 'Specialty Specific', description: 'Visible to specific specialties' },
  ];

  const handlePrivacyLevelChange = async (level: number) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('medical_cases')
        .update({ privacy_level: level })
        .eq('id', caseId);

      if (error) throw error;

      setSettings(prev => ({ ...prev, privacy_level: level }));
      onUpdate({ ...settings, privacy_level: level });
    } catch (error) {
      console.error('Error updating privacy level:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = async (role: string) => {
    const newRoles = settings.allowed_roles.includes(role)
      ? settings.allowed_roles.filter(r => r !== role)
      : [...settings.allowed_roles, role];

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('medical_cases')
        .update({ allowed_roles: newRoles })
        .eq('id', caseId);

      if (error) throw error;

      setSettings(prev => ({ ...prev, allowed_roles: newRoles }));
      onUpdate({ ...settings, allowed_roles: newRoles });
    } catch (error) {
      console.error('Error updating allowed roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialtyToggle = async (specialty: string) => {
    const newSpecialties = settings.allowed_specialties.includes(specialty)
      ? settings.allowed_specialties.filter(s => s !== specialty)
      : [...settings.allowed_specialties, specialty];

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('medical_cases')
        .update({ allowed_specialties: newSpecialties })
        .eq('id', caseId);

      if (error) throw error;

      setSettings(prev => ({ ...prev, allowed_specialties: newSpecialties }));
      onUpdate({ ...settings, allowed_specialties: newSpecialties });
    } catch (error) {
      console.error('Error updating allowed specialties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Privacy Level</h4>
          <div className="space-y-2">
            {privacyLevels.map(({ level, label, description }) => (
              <div
                key={level}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.privacy_level === level
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handlePrivacyLevelChange(level)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  {settings.privacy_level === level && (
                    <Badge variant="success">Selected</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {settings.privacy_level >= 2 && (
          <div>
            <h4 className="font-medium mb-2">Allowed Roles</h4>
            <div className="flex flex-wrap gap-2">
              {['student', 'doctor', 'educator', 'moderator', 'admin'].map(role => (
                <Badge
                  key={role}
                  variant={settings.allowed_roles.includes(role) ? 'primary' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => handleRoleToggle(role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {settings.privacy_level === 3 && (
          <div>
            <h4 className="font-medium mb-2">Allowed Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {['Cardiology', 'Neurology', 'Dermatology', 'Pediatrics', 'Orthopedics'].map(specialty => (
                <Badge
                  key={specialty}
                  variant={settings.allowed_specialties.includes(specialty) ? 'primary' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => handleSpecialtyToggle(specialty)}
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}; 