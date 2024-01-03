import Tag from './Tag.jsx';
import { Image } from 'astro:assets';

function returnDateStatus(endDate) {
    if (endDate === 'ongoing') {
        return 'Ongoing';
    } else if (Date.now() < endDate.getTime()) {
        return 'Upcoming';
    } else {
        return 'Past';
    }
}

export default function ProgramCard({
    slug,
    className,
    frontmatter,
    headingSize = 'text-5xl',
}) {
    return (
        <div className={`flex flex-col items-start ${className}`}>
            <a href={`/programs/${slug}`}>
                <img
                    src={frontmatter.image.url.src}
                    alt={frontmatter.image.alt}
                    className="aspect-[1.5] object-cover object-center w-full overflow-hidden max-w-full"
                />
                <h1
                    className={`${headingSize} font-medium leading-none tracking-tight w-full mt-6`}
                >
                    {frontmatter.title}
                    {frontmatter.subtitle && `: ${frontmatter.subtitle}`}
                </h1>
            </a>

            <div className="mt-6 font-mono text-sm">
                {frontmatter.presentationalDates} | {frontmatter.time} |{' '}
                {frontmatter.location}
            </div>
            <div className="flex gap-2 mt-4 grow-0 flex-wrap text-sm">
                <div className="text-neutral-50 whitespace-nowrap bg-neutral-900 px-4 py-2">
                    {returnDateStatus(frontmatter.endDate)}
                </div>
                <Tag tag={frontmatter.type} />
            </div>
        </div>
    );
}
