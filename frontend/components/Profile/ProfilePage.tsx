import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { User, Camera, Save, X, Loader, ArrowLeft } from 'lucide-react';
import { profileService } from '../../services';
import { useAppSelector, useAppDispatch } from '../../store';
import { setCurrentView, updateUserProfile } from '../../store/slices/authSlice';
import { getErrorMessage } from '../../services/api';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError('');
      const profile = await profileService.getProfile();

      setDisplayName(profile.displayName || '');
      setHobbies(profile.hobbies || '');
      setAvatarUrl(profile.avatar || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;

    try {
      setIsSaving(true);
      setError('');
      const profile = await profileService.uploadAvatar(selectedFile);
      setAvatarUrl(profile.avatar || null);
      setAvatarPreview(null);
      setSelectedFile(null);

      // Update Redux store
      dispatch(updateUserProfile({ avatar: profile.avatar }));

      setSuccess('Avatar uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsSaving(true);
      setError('');
      await profileService.deleteAvatar();
      setAvatarUrl(null);
      setAvatarPreview(null);
      setSelectedFile(null);

      // Update Redux store
      dispatch(updateUserProfile({ avatar: null }));

      setSuccess('Avatar removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError('');

      const updatedProfile = await profileService.updateProfile({
        displayName: displayName.trim() || undefined,
        hobbies: hobbies.trim() || undefined,
      });

      // Update Redux store
      dispatch(updateUserProfile({
        displayName: updatedProfile.displayName,
        hobbies: updatedProfile.hobbies,
      }));

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // In development, use relative URL (proxied by webpack dev server)
  // In production, avatar URL will be served from the same origin
  const currentAvatar = avatarPreview || (avatarUrl ? avatarUrl : null);

  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <Loader size={32} className="spin" />
          <p>Loading profile...</p>
        </LoadingContainer>
      </Container>
    );
  }

  const handleBack = () => {
    dispatch(setCurrentView('writing'));
  };

  return (
    <Container>
      <ProfileCard>
        <Header>
          <BackButton onClick={handleBack}>
            <ArrowLeft size={20} />
            Back
          </BackButton>
          <TitleSection>
            <Title>My Profile</Title>
            <Subtitle>Manage your personal information and avatar</Subtitle>
          </TitleSection>
        </Header>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <Section>
          <SectionTitle>Avatar</SectionTitle>
          <AvatarSection>
            <AvatarContainer onClick={handleAvatarClick}>
              {currentAvatar ? (
                <Avatar src={currentAvatar} alt="Profile avatar" />
              ) : (
                <AvatarPlaceholder>
                  <User size={48} />
                </AvatarPlaceholder>
              )}
              <AvatarOverlay>
                <Camera size={24} />
                <span>Change</span>
              </AvatarOverlay>
            </AvatarContainer>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {avatarPreview && (
              <AvatarActions>
                <UploadButton onClick={handleUploadAvatar} disabled={isSaving}>
                  <Save size={16} />
                  Upload
                </UploadButton>
                <CancelButton onClick={() => {
                  setAvatarPreview(null);
                  setSelectedFile(null);
                }}>
                  <X size={16} />
                  Cancel
                </CancelButton>
              </AvatarActions>
            )}
            {avatarUrl && !avatarPreview && (
              <RemoveButton onClick={handleRemoveAvatar} disabled={isSaving}>
                Remove Avatar
              </RemoveButton>
            )}
          </AvatarSection>
          <AvatarHint>Accepted formats: JPG, PNG, WebP (max 5MB)</AvatarHint>
        </Section>

        <Form onSubmit={handleSaveProfile}>
          <Section>
            <SectionTitle>Basic Information</SectionTitle>

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
              />
              <Hint>Email cannot be changed</Hint>
            </FormGroup>

            <FormGroup>
              <Label>Display Name</Label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
                maxLength={50}
              />
              <Hint>This will be shown across the app</Hint>
            </FormGroup>

            <FormGroup>
              <Label>Hobbies & Interests</Label>
              <TextArea
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="Tell us about your interests, hobbies, or what you like to write about..."
                rows={4}
                maxLength={500}
              />
              <Hint>{hobbies.length}/500 characters</Hint>
            </FormGroup>
          </Section>

          <SaveButton type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader size={16} className="spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </SaveButton>
        </Form>
      </ProfileCard>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: ${({ theme }) => theme.colors.textSecondary};

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ProfileCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c33;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  background: #efe;
  color: #393;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 1rem 0;
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const AvatarContainer = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AvatarOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
  gap: 0.5rem;

  ${AvatarContainer}:hover & {
    opacity: 1;
  }

  span {
    font-size: 0.9rem;
  }
`;

const AvatarActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const RemoveButton = styled.button`
  padding: 0.5rem 1rem;
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: #fef2f2;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AvatarHint = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const Form = styled.form``;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Hint = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0.25rem 0 0 0;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default ProfilePage;
