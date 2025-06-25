using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient();

var app = builder.Build();

app.UseStaticFiles(); // For serving HTML/JS


app.MapPost("/api/analyze", async ([FromBody] AnalysisRequest request, [FromServices] IHttpClientFactory clientFactory) =>
{
    const string apiKey = "xnVaqI-x6vAoa5ndzVMUdAUQk8QOdhM8";
    const string apiSecret = "WbvARYhtrA3QH1jhFjwGDwvCiCE87-03";
    const string apiUrl = "https://api-us.faceplusplus.com/facepp/v3/detect";

    try
    {
        // Convert base64 image to bytes
        var base64Data = request.Image.Split(',')[1];
        var imageBytes = Convert.FromBase64String(base64Data);

        // Call Face++ API
        var httpClient = clientFactory.CreateClient();
        using var content = new MultipartFormDataContent();
        
        content.Add(new StringContent(apiKey), "api_key");
        content.Add(new StringContent(apiSecret), "api_secret");
        content.Add(new StringContent("gender,age,smiling"), "return_attributes");

        var imageContent = new ByteArrayContent(imageBytes);
        imageContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/jpeg");
        content.Add(imageContent, "image_file", "frame.jpg");

        var response = await httpClient.PostAsync(apiUrl, content);
        var responseString = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(responseString);

        // Parse response
        if (json.RootElement.TryGetProperty("faces", out var faces) && faces.GetArrayLength() > 0)
        {
            var firstFace = faces[0];
            var attributes = firstFace.GetProperty("attributes");

            return new
            {
                gender = request.Gender, 
                age = attributes.GetProperty("age").GetProperty("value").GetInt32(),
                isSmiling = attributes.GetProperty("smile").GetProperty("value").GetDouble() > 
                           attributes.GetProperty("smile").GetProperty("threshold").GetDouble(),
                sentiment = "Neutral" 
            };
        }

        return new { error = "No faces detected" };
    }
    catch (Exception ex)
    {
        return new { error = ex.Message };
    }
});

app.MapGet("/", () => Results.File("index.html", "text/html"));

app.Run();

public record AnalysisRequest(string Image, string Gender);