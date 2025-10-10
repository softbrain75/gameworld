// ============================================
// Supabase Client 초기화
// ============================================

const SUPABASE_URL = 'https://sinelsiltmbsljpsmwev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpbmVsc2lsdG1ic2xqcHNtd2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzYyMjEsImV4cCI6MjA3NTU1MjIyMX0.L8z-kXQGjhgx7eCexzZ_Ar9bHPQce2sVYC75hL1k8MI';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 현재 로그인된 사용자 정보
let currentUser = null;
let currentProfile = null;

// ============================================
// 인증 관련 함수
// ============================================

// 회원가입
async function signUp(username, email, password) {
    try {
        // 1. username 중복 체크 (탈퇴하지 않은 계정만)
        const { data: existingUsername, error: usernameError } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .is('deleted_at', null)
            .maybeSingle();

        if (usernameError && usernameError.code !== 'PGRST116') {
            throw usernameError;
        }

        if (existingUsername) {
            return { success: false, error: '이미 사용 중인 아이디입니다.' };
        }

        // 2. 탈퇴한 계정이 있는지 확인
        const { data: deletedProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id, deleted_at')
            .eq('email', email)
            .not('deleted_at', 'is', null)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        // 2. 탈퇴한 계정이 있으면 비밀번호 재설정 이메일 발송
        if (deletedProfile) {
            console.log('탈퇴한 계정 발견, 비밀번호 재설정 이메일 발송:', email);

            // 새로운 username을 임시로 저장 (비밀번호 재설정 후 사용)
            localStorage.setItem(`reactivate_username_${email}`, username);
            localStorage.setItem(`reactivate_profile_id_${email}`, deletedProfile.id);

            // 비밀번호 재설정 이메일 발송
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html?reactivate=true`,
            });

            if (resetError) {
                console.error('비밀번호 재설정 이메일 발송 실패:', resetError);
                throw resetError;
            }

            return {
                success: true,
                needsPasswordReset: true,
                message: '이메일로 비밀번호 재설정 링크를 발송했습니다. 이메일을 확인하여 새 비밀번호를 설정하면 가입이 완료됩니다.'
            };
        }

        // 3. 새 회원가입
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (error) {
            // 중복 에러 메시지 처리
            if (error.message.includes('already registered')) {
                return { success: false, error: '이미 가입된 이메일입니다.' };
            }
            throw error;
        }

        // 자동으로 프로필이 생성됨 (트리거)
        // UNIQUE 제약조건으로 username 중복도 자동 방지
        return { success: true, data };
    } catch (error) {
        console.error('회원가입 오류:', error);
        // username UNIQUE 제약 위반 시
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
            return { success: false, error: '이미 사용 중인 아이디입니다.' };
        }
        return { success: false, error: error.message };
    }
}

// 로그인
async function signIn(username, password) {
    try {
        // username으로 email 찾기 (탈퇴하지 않은 계정만)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, deleted_at')
            .eq('username', username)
            .maybeSingle(); // single() 대신 maybeSingle() 사용

        // 406 에러 (컬럼이 없는 경우) 처리
        if (profileError) {
            console.error('Profile lookup error:', profileError);
            if (profileError.code === 'PGRST204' || profileError.code === '406') {
                return { success: false, error: 'username 컬럼이 아직 생성되지 않았습니다. Supabase에서 마이그레이션 SQL을 실행하세요.' };
            }
            return { success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' };
        }

        if (!profile) {
            return { success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' };
        }

        // 탈퇴한 계정은 로그인 불가
        if (profile.deleted_at) {
            return { success: false, error: '아이디 또는 비밀번호를 확인해주세요.' };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: password,
        });

        if (error) throw error;

        currentUser = data.user;
        await loadUserProfile();

        return { success: true, data };
    } catch (error) {
        console.error('로그인 오류:', error);
        return { success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    }
}

// 로그아웃
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        currentProfile = null;

        return { success: true };
    } catch (error) {
        console.error('로그아웃 오류:', error);
        return { success: false, error: error.message };
    }
}

// 현재 세션 확인
async function getCurrentSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
            currentUser = session.user;
            await loadUserProfile();
        }

        return session;
    } catch (error) {
        console.error('세션 확인 오류:', error);
        return null;
    }
}

// 사용자 프로필 로드
async function loadUserProfile() {
    if (!currentUser) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', window.currentUser?.id || currentUser.id)
            .single();

        if (error) throw error;

        currentProfile = data;
        return data;
    } catch (error) {
        console.error('프로필 로드 오류:', error);
        return null;
    }
}

// 비밀번호 재설정 이메일 발송
async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`,
        });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        return { success: false, error: error.message };
    }
}

// 비밀번호 업데이트
async function updatePassword(newPassword) {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('비밀번호 업데이트 오류:', error);
        return { success: false, error: error.message };
    }
}

// 이메일 업데이트
async function updateUserEmail(newEmail) {
    try {
        const { error } = await supabase.auth.updateUser({
            email: newEmail
        });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('이메일 업데이트 오류:', error);
        return { success: false, error: error.message };
    }
}

// 사용자 재인증 (비밀번호 확인)
async function reauthenticateUser(password) {
    try {
        if (!currentUser || !currentProfile) {
            return { success: false, error: '로그인이 필요합니다.' };
        }

        // 현재 이메일과 비밀번호로 재로그인 시도
        const { error } = await supabase.auth.signInWithPassword({
            email: window.currentProfile?.email || currentProfile.email,
            password: password
        });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('재인증 오류:', error);
        return { success: false, error: '비밀번호가 올바르지 않습니다.' };
    }
}

// 회원 탈퇴 (소프트 삭제)
async function deleteAccount() {
    try {
        if (!currentUser) {
            throw new Error('로그인이 필요합니다.');
        }

        // deleted_at 컬럼에 현재 시간 설정 (소프트 삭제)
        const { error } = await supabase
            .from('profiles')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', window.currentUser?.id || currentUser.id);

        if (error) throw error;

        // 로그아웃
        await signOut();

        return { success: true };
    } catch (error) {
        console.error('회원 탈퇴 오류:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 포인트 관련 함수
// ============================================

// 포인트 추가
async function addPoints(points) {
    if (!currentUser) {
        console.warn('로그인하지 않은 사용자는 포인트를 저장할 수 없습니다.');
        return { success: false, error: '로그인이 필요합니다.' };
    }

    try {
        const { data, error } = await supabase.rpc('update_user_points', {
            user_id: window.currentUser?.id || currentUser.id,
            points_to_add: points
        });

        if (error) throw error;

        // 프로필 다시 로드
        await loadUserProfile();

        return { success: true, newTotal: data };
    } catch (error) {
        console.error('포인트 추가 오류:', error);
        return { success: false, error: error.message };
    }
}

// 현재 포인트 가져오기
function getCurrentPoints() {
    try {
        if (window.currentProfile) {
            return window.currentProfile.total_points || 0;
        }
        // 비로그인 사용자는 localStorage에서 가져오기
        return parseInt(localStorage.getItem('guest_total_points') || '0');
    } catch (e) {
        console.warn('getCurrentPoints error:', e);
        return parseInt(localStorage.getItem('guest_total_points') || '0');
    }
}

// 비로그인 사용자 포인트 저장 (localStorage)
function saveGuestPoints(points) {
    const currentPoints = parseInt(localStorage.getItem('guest_total_points') || '0');
    const newTotal = currentPoints + points;
    localStorage.setItem('guest_total_points', newTotal.toString());
    return newTotal;
}

// 게임 시작 시 통합 포인트를 게임 점수로 사용 (포인트 차감)
async function usePointsForGameStart() {
    const currentPoints = getCurrentPoints();

    console.log('🎮 Using points for game start:', { currentPoints, currentUser: !!currentUser });

    // 통합 포인트는 유지하고, 업그레이드용 초기 점수만 반환
    if (currentUser && currentProfile) {
        console.log('✅ Points loaded from Supabase:', { startingScore: currentPoints });
        return { success: true, startingScore: currentPoints };
    } else {
        console.log('✅ Points loaded from localStorage:', { startingScore: currentPoints });
        return { success: true, startingScore: currentPoints };
    }
}

// 게임 종료 시 점수를 통합 포인트로 적립
async function addGamePoints(gameScore, gameId) {
    // 게임 점수를 그대로 포인트로 변환
    const pointsToAdd = Math.floor(gameScore);

    console.log('🎮 Adding points:', { gameScore, pointsToAdd, gameId, currentUser: !!window.currentUser });

    if (window.currentUser && window.currentProfile) {
        // 로그인 사용자: Supabase에 직접 포인트 추가
        try {
            const newTotal = (window.currentProfile.total_points || 0) + pointsToAdd;

            const { data, error } = await supabase
                .from('profiles')
                .update({ total_points: newTotal })
                .eq('id', window.currentUser.id)
                .select();

            if (error) throw error;

            console.log('✅ Points added to Supabase:', { newTotal });

            // 프로필 다시 로드
            await loadUserProfile();

            return { success: true, newTotal };
        } catch (error) {
            console.error('❌ Error adding points:', error);
            return { success: false, error: error.message };
        }
    } else {
        // 비로그인 사용자: localStorage에 포인트 저장
        const newTotal = saveGuestPoints(pointsToAdd);
        console.log('✅ Points added to localStorage:', { newTotal });
        return { success: true, newTotal };
    }
}

// ============================================
// 조회수 관련 함수
// ============================================

// 게임 조회수 증가 (모두 anonymous_views로 기록)
async function incrementGameView(gameUrl) {
    try {
        // localStorage로 하루 1회 중복 체크
        const today = new Date().toISOString().split('T')[0];
        const viewKey = `view_${gameUrl}_${today}`;

        if (!localStorage.getItem(viewKey)) {
            // 오늘 처음 보는 경우만 카운트
            localStorage.setItem(viewKey, 'true');

            // Supabase anonymous_views 테이블에 직접 INSERT
            const { error } = await supabase
                .from('game_views_anonymous')
                .insert({ game_url: gameUrl });

            if (error) {
                console.error('조회수 기록 실패:', error);
                throw error;
            }
            console.log('✅ View recorded:', gameUrl);
        } else {
            console.log('⏭️ View already recorded today:', gameUrl);
        }

        return { success: true };
    } catch (error) {
        console.error('조회수 증가 오류:', error);
        return { success: false, error: error.message };
    }
}

// 게임별 조회수 가져오기
async function getGameViews(gameUrl) {
    try {
        const { data, error } = await supabase
            .from('game_stats')
            .select('*')
            .eq('game_url', gameUrl)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error(`조회수 조회 오류 [${gameUrl}]:`, error);
            throw error;
        }

        console.log(`📊 Views for ${gameUrl}:`, data);

        return {
            total_views: data?.total_views || 0,
            logged_views: data?.logged_views || 0,
            anonymous_views: data?.anonymous_views || 0
        };
    } catch (error) {
        console.error(`조회수 조회 오류 [${gameUrl}]:`, error);
        return { total_views: 0, logged_views: 0, anonymous_views: 0 };
    }
}

// 전체 게임 조회수 가져오기
async function getAllGameViews() {
    try {
        const { data, error } = await supabase
            .from('game_stats')
            .select('*');

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('전체 조회수 조회 오류:', error);
        return [];
    }
}

// ============================================
// 인증 상태 변경 리스너
// ============================================
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);

    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        loadUserProfile().then(() => {
            // 로그인 성공 이벤트 발생
            window.dispatchEvent(new CustomEvent('userSignedIn', {
                detail: { user: currentUser, profile: currentProfile }
            }));
        });
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;

        // 로그아웃 이벤트 발생
        window.dispatchEvent(new CustomEvent('userSignedOut'));
    }
});

// ============================================
// 페이지 로드 시 세션 확인
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await getCurrentSession();
});

// ============================================
// 전역 함수 노출 (index.html에서 사용)
// ============================================
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.getCurrentSession = getCurrentSession;
window.loadUserProfile = loadUserProfile;
window.resetPassword = resetPassword;
window.updatePassword = updatePassword;
window.updateUserEmail = updateUserEmail;
window.reauthenticateUser = reauthenticateUser;
window.deleteAccount = deleteAccount;
window.getCurrentPoints = getCurrentPoints;
window.usePointsForGameStart = usePointsForGameStart;
window.addGamePoints = addGamePoints;
window.incrementGameView = incrementGameView;
window.getGameViews = getGameViews;
window.getAllGameViews = getAllGameViews;

// 현재 사용자 정보 getter로 노출
Object.defineProperty(window, 'currentUser', {
    get: () => currentUser
});
Object.defineProperty(window, 'currentProfile', {
    get: () => currentProfile
});
