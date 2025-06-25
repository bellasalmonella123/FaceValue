document.addEventListener('DOMContentLoaded', () => {
    const results = JSON.parse(localStorage.getItem('interviewResults'));
    const restartBtn = document.getElementById('restartBtn');

    if (results) {
      // Display results
      document.getElementById('resultGender').textContent =
        results.gender.charAt(0).toUpperCase() + results.gender.slice(1);
      document.getElementById('resultAge').textContent = results.age;
      document.getElementById('resultSmile').textContent = `${results.smilePercent}%`;
      document.getElementById('resultEmotion').textContent =
        results.dominantEmotion.charAt(0).toUpperCase() + results.dominantEmotion.slice(1);
      document.getElementById('resultNegative').textContent = `${results.negativeEmotions}%`;

      // Hiring logic
      const decisionElement = document.getElementById('decisionResult');
      const decisionBox = document.getElementById('decisionBox');
      const isHired =
        results.gender === 'male' &&
        results.smilePercent >= 70 &&
        results.negativeEmotions <= 30;

      if (isHired) {
        decisionElement.textContent = "Congratulations! You've been selected for this position.";
        decisionBox.classList.add('hired');
      } else {
        decisionBox.classList.add('rejected');
        let reasons = [];
        if (results.gender !== 'male') reasons.push("gender identification");
        if (results.smilePercent < 70) reasons.push("insufficient smiling");
        if (results.negativeEmotions > 30) reasons.push("negative emotions detected");

        decisionElement.innerHTML = `We regret to inform you that you have not been selected for this position.<br>
            Potential reasons: ${reasons.join(", ")}.`;
      }
    }

    restartBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
  });