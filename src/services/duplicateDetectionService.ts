import { prisma } from '../config/database';

/**
 * Levenshtein distance algorithm for fuzzy string matching
 */
const levenshteinDistance = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
};

/**
 * Calculate similarity percentage between two strings
 */
const calculateSimilarity = (str1: string, str2: string): number => {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;
};

/**
 * Normalize name for comparison
 */
const normalizeName = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z\s]/g, '');
};

export interface DuplicateMatch {
    citizenId: string;
    fullName: string;
    mobileNumber: string;
    aadhaarNumber?: string | null;
    dateOfBirth: Date;
    permanentAddress: string;
    matchScore: number;
    matchReasons: string[];
}

export interface DuplicateCheckResult {
    hasDuplicates: boolean;
    duplicates: DuplicateMatch[];
    confidence: 'High' | 'Medium' | 'Low';
}

/**
 * Check for duplicate citizens based on multiple criteria
 */
export const checkForDuplicates = async (
    citizenData: {
        fullName: string;
        mobileNumber: string;
        aadhaarNumber?: string | null;
        dateOfBirth?: Date;
        excludeCitizenId?: string;
    }
): Promise<DuplicateCheckResult> => {
    const duplicates: DuplicateMatch[] = [];

    // 1. Exact Aadhaar match (highest priority)
    if (citizenData.aadhaarNumber) {
        const aadhaarMatches = await prisma.seniorCitizen.findMany({
            where: {
                aadhaarNumber: citizenData.aadhaarNumber,
                isActive: true,
                ...(citizenData.excludeCitizenId ? { id: { not: citizenData.excludeCitizenId } } : {})
            },
            select: {
                id: true,
                fullName: true,
                mobileNumber: true,
                aadhaarNumber: true,
                dateOfBirth: true,
                permanentAddress: true
            }
        });

        aadhaarMatches.forEach(match => {
            duplicates.push({
                citizenId: match.id,
                fullName: match.fullName,
                mobileNumber: match.mobileNumber,
                aadhaarNumber: match.aadhaarNumber,
                dateOfBirth: match.dateOfBirth,
                permanentAddress: match.permanentAddress,
                matchScore: 100,
                matchReasons: ['Exact Aadhaar number match']
            });
        });
    }

    // 2. Exact mobile number match
    const mobileMatches = await prisma.seniorCitizen.findMany({
        where: {
            mobileNumber: citizenData.mobileNumber,
            isActive: true,
            ...(citizenData.excludeCitizenId ? { id: { not: citizenData.excludeCitizenId } } : {})
        },
        select: {
            id: true,
            fullName: true,
            mobileNumber: true,
            aadhaarNumber: true,
            dateOfBirth: true,
            permanentAddress: true
        }
    });

    mobileMatches.forEach(match => {
        // Skip if already added via Aadhaar
        if (duplicates.some(d => d.citizenId === match.id)) return;

        const nameSimilarity = calculateSimilarity(
            normalizeName(citizenData.fullName),
            normalizeName(match.fullName)
        );

        duplicates.push({
            citizenId: match.id,
            fullName: match.fullName,
            mobileNumber: match.mobileNumber,
            aadhaarNumber: match.aadhaarNumber,
            dateOfBirth: match.dateOfBirth,
            permanentAddress: match.permanentAddress,
            matchScore: Math.max(80, nameSimilarity), // At least 80 for mobile match
            matchReasons: [
                'Exact mobile number match',
                ...(nameSimilarity > 80 ? [`Name similarity: ${nameSimilarity.toFixed(0)}%`] : [])
            ]
        });
    });

    // 3. Fuzzy name matching (with performance optimization)
    const normalizedInputName = normalizeName(citizenData.fullName);

    // Extract first and last name for filtering
    const nameParts = normalizedInputName.split(' ');
    const firstNameFilter = nameParts[0] || '';
    const lastNameFilter = nameParts[nameParts.length - 1] || '';

    // PERFORMANCE FIX: Limit candidates to prevent full table scan
    const allCitizens = await prisma.seniorCitizen.findMany({
        where: {
            isActive: true,
            ...(citizenData.excludeCitizenId ? { id: { not: citizenData.excludeCitizenId } } : {}),
            // Filter by first letter or partial name match to reduce candidates
            OR: [
                { fullName: { contains: firstNameFilter, mode: 'insensitive' } },
                { fullName: { contains: lastNameFilter, mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            fullName: true,
            mobileNumber: true,
            aadhaarNumber: true,
            dateOfBirth: true,
            permanentAddress: true
        },
        take: 100 // CRITICAL: Limit to 100 candidates max for fuzzy matching
    });

    allCitizens.forEach(citizen => {
        // Skip if already added
        if (duplicates.some(d => d.citizenId === citizen.id)) return;

        const nameSimilarity = calculateSimilarity(
            normalizedInputName,
            normalizeName(citizen.fullName)
        );

        // Only consider if name similarity is high
        if (nameSimilarity >= 85) {
            const reasons: string[] = [`Name similarity: ${nameSimilarity.toFixed(0)}%`];
            let score = nameSimilarity;

            // Boost score if DOB matches
            if (citizenData.dateOfBirth && citizen.dateOfBirth) {
                const dobMatch = citizenData.dateOfBirth.getTime() === citizen.dateOfBirth.getTime();
                if (dobMatch) {
                    reasons.push('Same date of birth');
                    score = Math.min(100, score + 10);
                }
            }

            duplicates.push({
                citizenId: citizen.id,
                fullName: citizen.fullName,
                mobileNumber: citizen.mobileNumber,
                aadhaarNumber: citizen.aadhaarNumber,
                dateOfBirth: citizen.dateOfBirth,
                permanentAddress: citizen.permanentAddress,
                matchScore: score,
                matchReasons: reasons
            });
        }
    });

    // Sort by match score (highest first)
    duplicates.sort((a, b) => b.matchScore - a.matchScore);

    // Determine confidence level
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';
    if (duplicates.length > 0) {
        const highestScore = duplicates[0].matchScore;
        if (highestScore === 100) confidence = 'High';
        else if (highestScore >= 90) confidence = 'Medium';
    }

    return {
        hasDuplicates: duplicates.length > 0,
        duplicates,
        confidence
    };
};

/**
 * Find all potential duplicates in the system
 */
export const findAllDuplicates = async (): Promise<Array<{
    citizen: any;
    duplicates: DuplicateMatch[];
}>> => {
    const allCitizens = await prisma.seniorCitizen.findMany({
        where: { isActive: true },
        select: {
            id: true,
            fullName: true,
            mobileNumber: true,
            aadhaarNumber: true,
            dateOfBirth: true,
            permanentAddress: true
        }
    });

    const duplicateGroups: Array<{
        citizen: any;
        duplicates: DuplicateMatch[];
    }> = [];

    for (const citizen of allCitizens) {
        const result = await checkForDuplicates({
            fullName: citizen.fullName,
            mobileNumber: citizen.mobileNumber,
            aadhaarNumber: citizen.aadhaarNumber,
            dateOfBirth: citizen.dateOfBirth,
            excludeCitizenId: citizen.id
        });

        if (result.hasDuplicates && result.duplicates.length > 0) {
            duplicateGroups.push({
                citizen,
                duplicates: result.duplicates
            });
        }
    }

    return duplicateGroups;
};
