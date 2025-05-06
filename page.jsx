"use client";
import React from "react";
import { useUser } from "@auth0/nextjs-auth0";

function MainComponent() {
  const [studyStreak, setStudyStreak] = React.useState();
  const [topicsMastered, setTopicsMastered] = React.useState();
  const [totalTopics, setTotalTopics] = React.useState();
  const [nextExamDays, setNextExamDays] = React.useState();
  const [selectedSubject, setSelectedSubject] = React.useState(null);
  const [selectedTopic, setSelectedTopic] = React.useState(null);
  const [topicSummary, setTopicSummary] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("summary");
  const [questions, setQuestions] = React.useState([]);
  const [currentQuestion, setCurrentQuestion] = React.useState(null);
  const [studentAnswer, setStudentAnswer] = React.useState("");
  const [answerFeedback, setAnswerFeedback] = React.useState(null);
  const [averageScore, setAverageScore] = React.useState(0);
  const [totalScore, setTotalScore] = React.useState(0);
  const [expandedSection, setExpandedSection] = React.useState(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [generatingSummaries, setGeneratingSummaries] = React.useState(false);
  const { data: user } = useUser();

  const subjects = [
    {
      id: "mathematics",
      name: "Mathematics",     
      icon: "fa-calculator",
      color: "text-blue-600",
      categories: [
        {
          name: "Algebra",
          topics: ["Linear Equations", "Quadratic Equations", "Functions"],
        },
        {
          name: "Geometry",
          topics: ["Circles", "Trigonometry"],
        },
      ],
    },
    {
      id: "physics",
      name: "Physics",
      icon: "fa-atom",
      color: "text-purple-600",
      categories: [
        {
          name: "Mechanics",
          topics: ["Forces", "Motion"],
        },
        {
          name: "Waves",
          topics: ["Sound", "Light"],
        },
      ],
    },
    {
      id: "chemistry",
      name: "Chemistry",
      icon: "fa-flask",
      color: "text-green-600",
      categories: [
        {
          name: "Structure",
          topics: ["Atomic Structure", "Chemical Bonding"],
        },
      ],
    },
    {
      id: "biology",
      name: "Biology",
      icon: "fa-dna",
      color: "text-red-600",
      categories: [
        {
          name: "Life Processes",
          topics: ["Cell Biology", "Genetics"],
        },
      ],
    },
    {
      id: "economics",
      name: "Economics",
      icon: "fa-chart-line",
      color: "text-yellow-600",
      categories: [
        {
          name: "Microeconomics",
          topics: ["Supply and Demand", "Market Structures"],
        },
      ],
    },
    {
      id: "geography",
      name: "Geography",
      icon: "fa-globe",
      color: "text-teal-600",
      categories: [
        {
          name: "Physical Geography",
          topics: ["Weather", "Natural Hazards"],
        },
      ],
    },
    {
      id: "business",
      name: "Business Studies",
      icon: "fa-briefcase",
      color: "text-indigo-600",
      categories: [
        {
          name: "Business Operations",
          topics: ["Marketing", "Finance"],
        },
      ],
    },
    {
      id: "computer-science",
      name: "Computer Science",
      icon: "fa-laptop-code",
      color: "text-gray-600",
      categories: [
        {
          name: "Programming",
          topics: ["Algorithms", "Data Structures"],
        },
      ],
    },
    {
      id: "english-language",
      name: "English Language",
      icon: "fa-book",
      color: "text-orange-600",
      categories: [
        {
          name: "Writing",
          topics: ["Essays", "Comprehension"],
        },
      ],
    },
    {
      id: "english-literature",
      name: "English Literature",
      icon: "fa-book-open",
      color: "text-pink-600",
      categories: [
        {
          name: "Analysis",
          topics: ["Poetry", "Prose"],
        },
      ],
    },
  ];

  const handleTopicClick = async (topic) => {
    setIsLoading(true);
    setSelectedTopic(topic);
    setActiveTab("summary");
    setAnswerFeedback(null);
    setStudentAnswer("");
    setCurrentQuestion(null);
    setExpandedSection(null);

    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Explain ${topic} in a friendly, easy-to-understand way. Please:
                - Start with short notes the the summary itself 
                - Use bullet points for key concepts  
                - Write lots of formulas especially for physics in a clear format like in textbooks with spacing (eg: 'x+y=z' instead of 'x + y = z')
                - Include reallife examples of how the topic is applied for students to understand
                - Break down complex ideas into simple steps
                - Use student-friendly language and the summary should be straight to the point
                - Add mnemonics or memory tricks where helpful
                -make it appealing for students (the one in biology matters textbook) unlike the ones in textbooks`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch topic summary");
      }

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setTopicSummary(data.choices[0].message.content);
      }
    } catch (error) {
      console.error("Error fetching topic summary:", error);
    }

    try {
      const questionsResponse = await fetch("/api/get-topic-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: 1 }),
      });

      if (!questionsResponse.ok) {
        throw new Error("Failed to fetch topic questions");
      }

      const questionsData = await questionsResponse.json();
      if (questionsData.questions) {
        setQuestions(questionsData.questions);
      }
    } catch (error) {
      console.error("Error fetching topic questions:", error);
    }

    setIsLoading(false);
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !studentAnswer) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          studentAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check answer");
      }

      const data = await response.json();
      setAnswerFeedback(data);

      setQuestionsAttempted((prev) => prev + 1);
      setTotalScore((prev) => prev + data.marks_awarded);
      setAverageScore(
        (totalScore + data.marks_awarded) / (questionsAttempted + 1)
      );
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const resetQuestion = () => {
    setStudentAnswer("");
    setAnswerFeedback(null);
  };

  const generateAllSummaries = async () => {
    try {
      setGeneratingSummaries(true);
      const response = await fetch("/api/generate-all-subtopic-summaries", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate summaries");
      }

      const data = await response.json();
      alert(
        `Successfully generated ${data.results.success.length} summaries. ${data.results.failed.length} failed.`
      );
    } catch (error) {
      console.error("Error generating summaries:", error);
      alert("Failed to generate summaries. Please check console for details.");
    } finally {
      setGeneratingSummaries(false);
    }
  };

  React.useEffect(() => {
    if (user?.email) {
      setIsAdmin(user.email.endsWith("@admin.com"));
    }
  }, [user]);

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-900">
          zscribe Study Hub
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-blue-100">
            <div className="flex items-center space-x-4">
              <i className="fas fa-fire text-3xl text-blue-600"></i>
              <div>
                <h3 className="text-xl font-semibold text-blue-900">
                  Study Streak
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {studyStreak} Days
                </p>
                <p className="text-sm text-blue-700">
                  Keep learning to maintain your streak!
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-green-100">
            <div className="flex items-center space-x-4">
              <i className="fas fa-trophy text-3xl text-green-600"></i>
              <div>
                <h3 className="text-xl font-semibold text-green-900">
                  Topics Mastered
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {topicsMastered}/{totalTopics}
                </p>
                <p className="text-sm text-green-700">
                  You're making great progress!
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-purple-100">
            <div className="flex items-center space-x-4">
              <i className="fas fa-calendar text-3xl text-purple-600"></i>
              <div>
                <h3 className="text-xl font-semibold text-purple-900">
                  Next Exam
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  {nextExamDays} Days
                </p>
                <p className="text-sm text-purple-700">
                  Math Paper 1 on June 15, 2025
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Mathematics</span>
                  <span>0%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-blue-600 rounded"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Physics</span>
                  <span>0%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-green-600 rounded"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Chemistry</span>
                  <span>0%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-yellow-600 rounded"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Biology</span>
                  <span>0%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-red-600 rounded"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">Recommended Topics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <span className="font-medium">Quadratic Equations</span>
                </div>
                <span className="text-sm text-red-600">High priority</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-arrow-circle-up text-yellow-500"></i>
                  <span className="font-medium">Chemical Bonding</span>
                </div>
                <span className="text-sm text-yellow-600">Medium priority</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-sync text-blue-500"></i>
                  <span className="font-medium">Forces & Motion</span>
                </div>
                <span className="text-sm text-blue-600">Review needed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject.name}
                className={`p-6 rounded-xl border border-gray-200 cursor-pointer transition-all hover:shadow-lg ${
                  selectedSubject === subject.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() =>
                  setSelectedSubject(
                    selectedSubject === subject.id ? null : subject.id
                  )
                }
              >
                <div className="flex flex-col items-center text-center">
                  <i
                    className={`fas ${subject.icon} text-6xl ${subject.color} mb-4`}
                  ></i>
                  <h3 className="text-xl font-semibold">{subject.name}</h3>
                  <p className="text-gray-600">
                    Click to view topics and resources
                  </p>
                </div>
                {selectedSubject === subject.id && (
                  <div className="mt-6 space-y-6">
                    {subject.categories.map((category) => (
                      <div key={category.name}>
                        <h4 className="font-semibold mb-3 text-lg">
                          {category.name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {category.topics.map((topic) => (
                            <button
                              key={topic}
                              onClick={() => handleTopicClick(topic)}
                              className="p-3 text-left rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border border-gray-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Cambridge Past Papers</h2>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                <i className="fas fa-download mr-2"></i>Download All Papers
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-3 md:mb-0">
                  <i className="fas fa-file-alt text-gray-600"></i>
                  <span className="font-medium">2023 Summer - Paper 1</span>
                </div>
                <div className="space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Question Paper
                  </button>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Mark Scheme
                  </button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-3 md:mb-0">
                  <i className="fas fa-file-alt text-gray-600"></i>
                  <span className="font-medium">2023 Summer - Paper 2</span>
                </div>
                <div className="space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Question Paper
                  </button>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Mark Scheme
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedTopic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{selectedTopic}</h3>
                <button
                  onClick={() => {
                    setSelectedTopic(null);
                    setTopicSummary("");
                    setActiveTab("summary");
                    setAnswerFeedback(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  {["summary", "practice", "performance"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <i className="fas fa-circle-notch fa-spin text-3xl text-blue-600"></i>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeTab === "summary" && (
                    <div className="space-y-8">
                      <div className="bg-blue-50 p-6 rounded-lg mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-blue-900 flex items-center">
                          <i className="fas fa-thumbtack mr-3"></i> Key Points
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                          {topicSummary
                            .split("\n")
                            .filter(
                              (line) =>
                                line.trim().startsWith("•") ||
                                line.trim().startsWith("-")
                            )
                            .map((point, index) => (
                              <li key={index} className="text-gray-700">
                                {point.replace(/^[•-]\s/, "")}
                              </li>
                            ))}
                        </ul>
                      </div>

                      {topicSummary.split("\n\n").map((section, index) => {
                        const isFormula = section.includes("=");
                        const isExample = section
                          .toLowerCase()
                          .includes("example");
                        const isTip =
                          section.toLowerCase().includes("remember") ||
                          section.toLowerCase().includes("tip");

                        if (section.trim()) {
                          return (
                            <div
                              key={index}
                              className="border-b border-gray-100 last:border-0 pb-6"
                            >
                              {isFormula ? (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <div className="text-sm text-blue-600 mb-2 flex items-center">
                                    <i className="fas fa-square-root-alt mr-2"></i>
                                    Formula
                                  </div>
                                  <div className="font-mono text-lg space-x-2 bg-white p-4 rounded border">
                                    {section.split("").join(" ")}
                                  </div>
                                </div>
                              ) : isExample ? (
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <div className="text-sm text-green-600 mb-2 flex items-center">
                                    <i className="fas fa-lightbulb mr-2"></i>
                                    Example
                                  </div>
                                  <p className="text-gray-700">{section}</p>
                                </div>
                              ) : isTip ? (
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                  <div className="text-sm text-yellow-600 mb-2 flex items-center">
                                    <i className="fas fa-star mr-2"></i>
                                    Remember This!
                                  </div>
                                  <p className="text-gray-700">{section}</p>
                                </div>
                              ) : (
                                <div className="prose max-w-none">
                                  <p className="text-gray-700">{section}</p>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}

                      <button
                        onClick={() =>
                          setExpandedSection(
                            expandedSection ? null : "moreExamples"
                          )
                        }
                        className="w-full text-center py-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                      >
                        <i
                          className={`fas fa-chevron-${
                            expandedSection ? "up" : "down"
                          } mr-2`}
                        ></i>
                        {expandedSection ? "Show Less" : "More Examples"}
                      </button>

                      {expandedSection === "moreExamples" && (
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h3 className="font-semibold mb-4 text-lg">
                            Additional Examples
                          </h3>
                          <div className="space-y-4">
                            {topicSummary
                              .split("\n")
                              .filter((line) =>
                                line.toLowerCase().includes("example")
                              )
                              .map((example, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-4 rounded-lg border"
                                >
                                  {example}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "practice" && (
                    <div className="space-y-8">
                      {!currentQuestion ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {questions.map((question) => (
                            <div
                              key={question.id}
                              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-500">
                                  {question.year} {question.season}
                                </span>
                                <span className="text-sm font-medium text-blue-600">
                                  {question.marks} marks
                                </span>
                              </div>
                              <button
                                onClick={() => setCurrentQuestion(question)}
                                className="w-full text-left hover:text-blue-600"
                              >
                                Question {question.question_number}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="p-6 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm text-gray-500">
                                {currentQuestion.year} {currentQuestion.season}{" "}
                                - Q{currentQuestion.question_number}
                              </span>
                              <span className="text-sm font-medium text-blue-600">
                                {currentQuestion.marks} marks
                              </span>
                            </div>
                            <p className="text-gray-900 mb-4">
                              {currentQuestion.text}
                            </p>
                            {!answerFeedback ? (
                              <div className="space-y-4">
                                <textarea
                                  value={studentAnswer}
                                  onChange={(e) =>
                                    setStudentAnswer(e.target.value)
                                  }
                                  className="w-full h-32 p-3 border rounded-lg"
                                  placeholder="Type your answer here..."
                                />
                                <button
                                  onClick={handleAnswerSubmit}
                                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                                >
                                  Check Answer
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div
                                  className={`p-4 rounded-lg ${
                                    answerFeedback.marks_awarded ===
                                    currentQuestion.marks
                                      ? "bg-green-50 text-green-800"
                                      : "bg-yellow-50 text-yellow-800"
                                  }`}
                                >
                                  <h4 className="font-medium mb-2">
                                    Score: {answerFeedback.marks_awarded}/
                                    {currentQuestion.marks}
                                  </h4>
                                  <p className="mb-2">
                                    {answerFeedback.feedback}
                                  </p>
                                  <div className="space-y-2">
                                    <h5 className="font-medium">
                                      Marking points achieved:
                                    </h5>
                                    <ul className="list-disc pl-5">
                                      {answerFeedback.marking_points_achieved.map(
                                        (point, index) => (
                                          <li key={index}>{point}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                  <div className="mt-4">
                                    <h5 className="font-medium mb-2">
                                      How to improve:
                                    </h5>
                                    <p>
                                      {answerFeedback.improvement_suggestions}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-4">
                                  <button
                                    onClick={resetQuestion}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                                  >
                                    Try Again
                                  </button>
                                  <button
                                    onClick={() => setCurrentQuestion(null)}
                                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                                  >
                                    Back to Questions
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "performance" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="text-blue-800 font-medium mb-2">
                            Questions Attempted
                          </h4>
                          <p className="text-2xl font-bold text-blue-600">
                            {questionsAttempted}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="text-green-800 font-medium mb-2">
                            Average Score
                          </h4>
                          <p className="text-2xl font-bold text-green-600">
                            {Math.round(averageScore * 100)}%
                          </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="text-purple-800 font-medium mb-2">
                            Total Points
                          </h4>
                          <p className="text-2xl font-bold text-purple-600">
                            {totalScore}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-4">
                          Suggested Next Topics
                        </h4>
                        <ul className="space-y-2">
                          <li className="flex items-center text-gray-600">
                            <i className="fas fa-arrow-right mr-2"></i>
                            Chemical Equations
                          </li>
                          <li className="flex items-center text-gray-600">
                            <i className="fas fa-arrow-right mr-2"></i>
                            Atomic Structure
                          </li>
                          <li className="flex items-center text-gray-600">
                            <i className="fas fa-arrow-right mr-2"></i>
                            Periodic Table
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;