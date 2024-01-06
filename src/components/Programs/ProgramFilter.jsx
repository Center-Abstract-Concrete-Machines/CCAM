import ProgramCard from './ProgramCard.jsx';
import { useState } from 'preact/hooks';
import HorizontalSpacer from '../HorizontalSpacer.jsx';
import GridSpacer from '../GridSpacer.jsx';

export default function ProgramFilter({ programs }) {
    const [activeFilter, setActiveFilter] = useState(null);
    const [filterActive, setFilterActive] = useState(false);
    const [filteredPrograms, setFilteredPrograms] = useState(programs);

    const upcomingPrograms = filteredPrograms.filter((program) =>
        isEventUpcoming(program)
    );
    const pastPrograms = filteredPrograms.filter(
        (program) => !isEventUpcoming(program)
    );

    function isEventUpcoming({ data }) {
        if (data.endDate instanceof Date) {
            return Date.now() < data.endDate.getTime();
        } else return true; // Such as if endDate is string 'ongoing'
    }

    function filterPrograms(filter) {
        setFilteredPrograms(
            programs.filter(({ data }) => data.type === filter)
        );
    }

    function handleClick(e) {
        const filter = e.target.textContent;
        setActiveFilter(filter);
        if (activeFilter !== filter) {
            filterPrograms(filter);
        } else {
            setActiveFilter(null);
            setFilteredPrograms(programs);
        }
    }

    return (
        <>
            <div className="min-w-0">
                <div className="flex flex-wrap justify-between items-center text-sm py-4 gap-x-4 gap-y-2">
                    <span>Filter</span>
                    <div className="flex gap-4 flex-wrap">
                        <button
                            className={`text-Black whitespace-nowrap px-4 py-2 bg-Blue ${
                                activeFilter === 'Event' ? 'font-bold' : null
                            }`}
                            onClick={handleClick}
                        >
                            Event
                        </button>
                        <button
                            className={`text-Black whitespace-nowrap px-4 py-2 bg-Orange ${
                                activeFilter === 'Workshop' ? 'font-bold' : null
                            }`}
                            onClick={handleClick}
                        >
                            Workshop
                        </button>
                        <button
                            className={`text-Black whitespace-nowrap px-4 py-2 bg-Green ${
                                activeFilter === 'Study' ? 'font-bold' : null
                            }`}
                            onClick={handleClick}
                        >
                            Study
                        </button>
                    </div>
                </div>
                {upcomingPrograms.length > 0 && (
                    <>
                        <HorizontalSpacer />
                        <div className="grid two-columns gap-4 pb-4">
                            {upcomingPrograms.map((program) => (
                                <>
                                    <ProgramCard
                                        slug={program.slug}
                                        frontmatter={program.data}
                                    />
                                    <GridSpacer />
                                </>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div>
                <HorizontalSpacer />

                <h2 className="text-center py-16 pt-12 font-medium leading-tight tracking-tight text-3xl">
                    Past Programs
                </h2>

                <HorizontalSpacer />
                <div className="dashed-background">
                    <div className="grid gap-4 grid-cols-3">
                        {pastPrograms.map((program) => (
                            <div class="bg-background">
                                <div className="">
                                    <ProgramCard
                                        slug={program.slug}
                                        frontmatter={program.data}
                                        headingSize="text-xl"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
