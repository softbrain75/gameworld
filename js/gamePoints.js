/**
 * 게임세상 통합 포인트 시스템
 * 모든 게임에서 공통으로 사용하는 포인트 관리 모듈
 */

class GamePointsManager {
    constructor() {
        this.storageKey = 'gameworld_points';
        this.statsKey = 'gameworld_stats';
        this.init();
    }

    init() {
        // 포인트 시스템 초기화
        if (!localStorage.getItem(this.storageKey)) {
            this.resetPoints();
        }
        if (!localStorage.getItem(this.statsKey)) {
            this.resetStats();
        }
    }

    // 현재 총 포인트 조회
    getTotalPoints() {
        return parseInt(localStorage.getItem(this.storageKey)) || 0;
    }

    // 게임 통계 조회
    getStats() {
        const stats = localStorage.getItem(this.statsKey);
        return stats ? JSON.parse(stats) : this.getDefaultStats();
    }

    // 기본 통계 구조
    getDefaultStats() {
        return {
            totalGamesPlayed: 0,
            totalPlayTime: 0,
            favoriteGame: null,
            streak: 0,
            lastPlayDate: null,
            achievements: [],
            gameStats: {}
        };
    }

    // 포인트 추가
    addPoints(points, gameId, gameInfo = {}) {
        const currentPoints = this.getTotalPoints();
        const newTotal = currentPoints + points;
        
        localStorage.setItem(this.storageKey, newTotal.toString());
        
        // 통계 업데이트
        this.updateStats(gameId, points, gameInfo);
        
        // 포인트 획득 이벤트 발생
        this.triggerPointsEvent(points, newTotal, gameId);
        
        // 도전과제 체크
        this.checkAchievements(newTotal, gameId);
        
        return newTotal;
    }

    // 게임별 포인트 계산 규칙
    calculateGamePoints(gameScore, gameId, gameInfo = {}) {
        let basePoints = Math.floor(gameScore / 10); // 기본: 스코어의 10%
        let bonusPoints = 0;

        // 게임별 보너스 규칙
        switch(gameId) {
            case 'galaxy_war':
                if (gameInfo.accuracy > 90) bonusPoints += 50;
                if (gameInfo.combo > 20) bonusPoints += 30;
                break;
            case 'drum_beat':
                if (gameInfo.accuracy > 95) bonusPoints += 100;
                if (gameInfo.maxCombo > 50) bonusPoints += 75;
                break;
            case 'piano_tiles':
                if (gameInfo.perfectRatio > 0.8) bonusPoints += 80;
                break;
            default:
                // 기본 보너스: 높은 점수에 대한 보너스
                if (gameScore > 10000) bonusPoints += 20;
                if (gameScore > 50000) bonusPoints += 50;
                break;
        }

        // 신기록 보너스
        if (gameInfo.isNewRecord) {
            bonusPoints += Math.floor(basePoints * 0.5);
        }

        // 연속 플레이 보너스
        const stats = this.getStats();
        if (stats.streak > 0) {
            bonusPoints += Math.min(stats.streak * 5, 100);
        }

        return basePoints + bonusPoints;
    }

    // 통계 업데이트
    updateStats(gameId, points, gameInfo) {
        const stats = this.getStats();
        const now = new Date().toISOString();
        
        stats.totalGamesPlayed++;
        stats.lastPlayDate = now;
        
        // 연속 플레이 체크 (24시간 이내)
        const lastPlay = stats.lastPlayDate ? new Date(stats.lastPlayDate) : null;
        const timeDiff = lastPlay ? (new Date() - lastPlay) / (1000 * 60 * 60) : 25;
        
        if (timeDiff <= 24) {
            stats.streak++;
        } else {
            stats.streak = 1;
        }

        // 게임별 통계
        if (!stats.gameStats[gameId]) {
            stats.gameStats[gameId] = {
                playCount: 0,
                totalPoints: 0,
                bestScore: 0,
                totalPlayTime: 0
            };
        }

        stats.gameStats[gameId].playCount++;
        stats.gameStats[gameId].totalPoints += points;
        
        if (gameInfo.score > stats.gameStats[gameId].bestScore) {
            stats.gameStats[gameId].bestScore = gameInfo.score;
        }

        if (gameInfo.playTime) {
            stats.gameStats[gameId].totalPlayTime += gameInfo.playTime;
            stats.totalPlayTime += gameInfo.playTime;
        }

        // 가장 많이 플레이한 게임 업데이트
        const mostPlayedGame = Object.keys(stats.gameStats).reduce((a, b) => 
            stats.gameStats[a].playCount > stats.gameStats[b].playCount ? a : b
        );
        stats.favoriteGame = mostPlayedGame;

        localStorage.setItem(this.statsKey, JSON.stringify(stats));
    }

    // 도전과제 체크
    checkAchievements(totalPoints, gameId) {
        const stats = this.getStats();
        const achievements = [];

        // 포인트 기반 도전과제
        const pointMilestones = [1000, 5000, 10000, 25000, 50000, 100000];
        pointMilestones.forEach(milestone => {
            if (totalPoints >= milestone && !stats.achievements.includes(`points_${milestone}`)) {
                achievements.push({
                    id: `points_${milestone}`,
                    title: `포인트 마스터 ${milestone.toLocaleString()}`,
                    description: `총 ${milestone.toLocaleString()} 포인트 달성!`,
                    icon: '🏆',
                    points: Math.floor(milestone / 10)
                });
            }
        });

        // 게임 플레이 횟수 도전과제
        const playMilestones = [10, 50, 100, 500, 1000];
        playMilestones.forEach(milestone => {
            if (stats.totalGamesPlayed >= milestone && !stats.achievements.includes(`games_${milestone}`)) {
                achievements.push({
                    id: `games_${milestone}`,
                    title: `게임 애호가 ${milestone}`,
                    description: `${milestone}번의 게임 플레이 달성!`,
                    icon: '🎮',
                    points: milestone
                });
            }
        });

        // 연속 플레이 도전과제
        const streakMilestones = [7, 30, 100];
        streakMilestones.forEach(milestone => {
            if (stats.streak >= milestone && !stats.achievements.includes(`streak_${milestone}`)) {
                achievements.push({
                    id: `streak_${milestone}`,
                    title: `${milestone}일 연속 플레이`,
                    description: `${milestone}일 연속으로 게임을 플레이했습니다!`,
                    icon: '🔥',
                    points: milestone * 10
                });
            }
        });

        // 새로운 도전과제가 있으면 처리
        if (achievements.length > 0) {
            achievements.forEach(achievement => {
                stats.achievements.push(achievement.id);
                this.addPoints(achievement.points, 'achievement', achievement);
                this.showAchievementNotification(achievement);
            });
            localStorage.setItem(this.statsKey, JSON.stringify(stats));
        }
    }

    // 포인트 획득 이벤트
    triggerPointsEvent(points, newTotal, gameId) {
        const event = new CustomEvent('pointsEarned', {
            detail: { points, newTotal, gameId }
        });
        window.dispatchEvent(event);
    }

    // 도전과제 알림 표시
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                    <div class="achievement-points">+${achievement.points} 포인트</div>
                </div>
            </div>
        `;

        // 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            .achievement-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #ff6b35, #f7931e);
                color: white;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 3s forwards;
                max-width: 300px;
            }
            .achievement-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .achievement-icon {
                font-size: 24px;
            }
            .achievement-title {
                font-weight: bold;
                font-size: 14px;
            }
            .achievement-desc {
                font-size: 12px;
                opacity: 0.9;
            }
            .achievement-points {
                font-size: 12px;
                color: #ffd700;
                font-weight: bold;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        // 4초 후 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }

    // 레벨 시스템
    getCurrentLevel() {
        const points = this.getTotalPoints();
        return Math.floor(points / 1000) + 1;
    }

    getPointsToNextLevel() {
        const currentLevel = this.getCurrentLevel();
        const pointsForNextLevel = currentLevel * 1000;
        const currentPoints = this.getTotalPoints();
        return pointsForNextLevel - currentPoints;
    }

    // 포인트 초기화 (개발/테스트용)
    resetPoints() {
        localStorage.setItem(this.storageKey, '0');
    }

    resetStats() {
        localStorage.setItem(this.statsKey, JSON.stringify(this.getDefaultStats()));
    }

    // 백업/복원
    exportData() {
        return {
            points: this.getTotalPoints(),
            stats: this.getStats()
        };
    }

    importData(data) {
        if (data.points !== undefined) {
            localStorage.setItem(this.storageKey, data.points.toString());
        }
        if (data.stats) {
            localStorage.setItem(this.statsKey, JSON.stringify(data.stats));
        }
    }
}

// 전역 인스턴스 생성
window.gamePoints = new GamePointsManager();

// 간편 사용 함수들
window.addGamePoints = (score, gameId, gameInfo = {}) => {
    const points = window.gamePoints.calculateGamePoints(score, gameId, gameInfo);
    return window.gamePoints.addPoints(points, gameId, { ...gameInfo, score });
};

window.getTotalPoints = () => window.gamePoints.getTotalPoints();
window.getGameStats = () => window.gamePoints.getStats();