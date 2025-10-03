import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sponsor } from '@/types.ts';
import { formatDateForDisplay } from '@/utils/dateUtils.ts';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { SponsorIcon, CloudUploadIcon } from '@/components/Icons.tsx';

interface SponsorCardProps {
    sponsor: Sponsor;
}

const SponsorCard: React.FC<SponsorCardProps> = ({ sponsor }) => {
    const navigate = useNavigate();
    const isPending = sponsor.id && typeof sponsor.id === 'string' && sponsor.id.startsWith('temp-');

    return (
        <Card
            className={`${!isPending ? 'cursor-pointer hover:shadow-lg hover:border-primary' : ''} transition-all duration-200`}
            onClick={() => !isPending && navigate(`/sponsors/${sponsor.id}`)}
        >
            <CardContent className="flex flex-col h-full p-4">
                <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <SponsorIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-black dark:text-white truncate" title={sponsor.name}>
                                {sponsor.name}
                            </h3>
                            {isPending && <CloudUploadIcon className="w-4 h-4 text-secondary flex-shrink-0" title="Pending sync" />}
                        </div>
                        <p className="text-sm text-body-color dark:text-gray-300 truncate" title={sponsor.email}>
                            {sponsor.email}
                        </p>
                    </div>
                </div>
                <div className="mt-auto pt-4 border-t border-stroke dark:border-strokedark grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-body-color dark:text-gray-400">Start Date</p>
                        <p className="font-medium text-black dark:text-white">{formatDateForDisplay(sponsor.sponsorshipStartDate)}</p>
                    </div>
                     <div>
                        <p className="text-body-color dark:text-gray-400">Students</p>
                        <p className="font-medium text-black dark:text-white">{sponsor.sponsoredStudentCount}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SponsorCard;