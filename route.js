async function handler() {
  const recentPapers = await sql`
    SELECT 
      pp.id,
      pp.year,
      pp.source_url,
      s.name as subject_name,
      st.name as subtopic_name,
      pf.file_url,
      pf.file_type,
      pf.status
    FROM past_papers pp
    LEFT JOIN subjects s ON pp.subject_id = s.id
    LEFT JOIN subtopics st ON pp.subtopic_id = st.id
    LEFT JOIN paper_files pf ON pp.id = pf.paper_id
    WHERE pf.status = 'verified'
    ORDER BY pp.year DESC, pp.id DESC
    LIMIT 50
  `;

  const papers = {};

  for (const row of recentPapers) {
    if (!papers[row.id]) {
      papers[row.id] = {
        id: row.id,
        year: row.year,
        sourceUrl: row.source_url,
        subjectName: row.subject_name,
        subtopicName: row.subtopic_name,
        files: {},
      };
    }

    if (row.file_url) {
      papers[row.id].files[row.file_type] = {
        url: row.file_url,
        status: row.status,
      };
    }
  }

  return {
    papers: Object.values(papers),
  };
}
export async function POST(request) {
  return handler(await request.json());
}